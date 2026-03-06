import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { FunctionDeclaration } from "@google/generative-ai";
import { db } from "@/db";
import { transactions, budgets, goals, alerts, userProfile } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { ChartSpec } from "./chart-types";

export const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// ─── Context Snapshot ─────────────────────────────────────────────────────────

export async function buildContextSnapshot(): Promise<string> {
  try {
    // Current month in the app format (e.g. "mar/26")
    const now = new Date();
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const currentMonth = `${monthNames[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`;

    // Run all queries in parallel
    const [monthlySummary, budgetStatus, activeGoals, activeAlerts, profile] = await Promise.all([
      // Monthly summary for last 2 months
      db.select({
        month: transactions.month,
        type: transactions.type,
        total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
        count: sql<number>`COUNT(*)`,
      })
        .from(transactions)
        .groupBy(transactions.month, transactions.type)
        .orderBy(desc(transactions.month))
        .limit(8),

      // Budget status current month
      db.select().from(budgets).where(eq(budgets.month, currentMonth)),

      // Active goals
      db.select().from(goals).where(eq(goals.status, "active")),

      // Active (non-dismissed) alerts
      db.select().from(alerts).where(sql`${alerts.dismissedAt} IS NULL`).limit(5),

      // User profile
      db.select().from(userProfile).limit(1),
    ]);

    // Build monthly summary structure
    const monthMap: Record<string, { receitas: number; despesas: number }> = {};
    for (const row of monthlySummary) {
      if (!monthMap[row.month]) monthMap[row.month] = { receitas: 0, despesas: 0 };
      monthMap[row.month][row.type === "receita" ? "receitas" : "despesas"] = Number(row.total);
    }

    const months = Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 2);

    const currentMonthData = monthMap[currentMonth] ?? { receitas: 0, despesas: 0 };
    const saldo = currentMonthData.receitas - currentMonthData.despesas;

    // Budget status
    const budgetsOverLimit = budgetStatus.filter(
      (b) => Number(b.spentAmount) > Number(b.limitAmount)
    );
    const budgetsWarning = budgetStatus.filter(
      (b) =>
        Number(b.spentAmount) / Number(b.limitAmount) >= 0.8 &&
        Number(b.spentAmount) <= Number(b.limitAmount)
    );

    // Goals
    const goalsInfo = activeGoals.map((g) => {
      const pct = g.targetAmount
        ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
        : 0;
      const remaining = Number(g.targetAmount) - Number(g.currentAmount);
      return `${g.name} ${pct}% (faltam R$ ${remaining.toFixed(2)}${g.deadline ? ` até ${g.deadline}` : ""})`;
    });

    // Profile
    const user = profile[0];

    // Compose snapshot
    const lines: string[] = [
      `=== CONTEXTO FINANCEIRO ATUAL (${now.toLocaleDateString("pt-BR")}) ===`,
      "",
      `📅 Mês atual: ${currentMonth}`,
    ];

    if (currentMonthData.receitas > 0 || currentMonthData.despesas > 0) {
      lines.push(`💰 Receitas: R$ ${currentMonthData.receitas.toFixed(2)}`);
      lines.push(`💸 Despesas: R$ ${currentMonthData.despesas.toFixed(2)}`);
      lines.push(`⚖️  Saldo: R$ ${saldo.toFixed(2)}${saldo < 0 ? " ⚠️ NEGATIVO" : ""}`);
    } else {
      lines.push(`📭 Sem transações registradas para ${currentMonth} ainda.`);
    }

    // Previous month comparison
    if (months.length >= 2) {
      const [, prev] = months;
      const prevSaldo = prev[1].receitas - prev[1].despesas;
      lines.push(`📊 Mês anterior (${prev[0]}): receitas R$ ${prev[1].receitas.toFixed(2)}, despesas R$ ${prev[1].despesas.toFixed(2)}, saldo R$ ${prevSaldo.toFixed(2)}`);
    }

    // Budget status
    if (budgetsOverLimit.length > 0) {
      lines.push("");
      lines.push(`🚨 Orçamentos ESTOURADOS (${currentMonth}):`);
      budgetsOverLimit.forEach((b) => {
        const pct = Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100);
        lines.push(`  • ${b.category}: R$ ${Number(b.spentAmount).toFixed(2)} / R$ ${Number(b.limitAmount).toFixed(2)} (${pct}%)`);
      });
    }
    if (budgetsWarning.length > 0) {
      lines.push(`⚠️  Orçamentos próximos do limite:`);
      budgetsWarning.forEach((b) => {
        const pct = Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100);
        lines.push(`  • ${b.category}: ${pct}% utilizado`);
      });
    }

    // Goals
    if (goalsInfo.length > 0) {
      lines.push("");
      lines.push(`🎯 Metas ativas:`);
      goalsInfo.forEach((g) => lines.push(`  • ${g}`));
    }

    // Alerts
    if (activeAlerts.length > 0) {
      lines.push("");
      lines.push(`🔔 Alertas ativos: ${activeAlerts.map((a) => a.message).join(" | ")}`);
    }

    // User profile
    if (user) {
      lines.push("");
      lines.push(`👤 Perfil: ${user.nome}`);
      if (user.rendaMensal) lines.push(`  Renda mensal: R$ ${Number(user.rendaMensal).toFixed(2)}`);
      if (user.objetivoPrincipal) lines.push(`  Objetivo principal: ${user.objetivoPrincipal}`);
      if (user.aiNotes) lines.push(`  📝 Notas da IA sobre o usuário: ${user.aiNotes}`);
    }

    lines.push("=== FIM DO CONTEXTO ===");
    return lines.join("\n");
  } catch (err) {
    console.error("buildContextSnapshot error:", err);
    return ""; // never block chat if context fails
  }
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const financeTools: FunctionDeclaration[] = [
  // ── READ: Transactions ──
  {
    name: "query_transactions",
    description:
      "Consulta transações financeiras do banco de dados. Use para responder perguntas sobre gastos, receitas e histórico financeiro.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.STRING, description: "Mês no formato 'jan/26'. Opcional." },
        category: { type: SchemaType.STRING, description: "Categoria como 'Transporte'. Opcional." },
        type: { type: SchemaType.STRING, format: "enum", enum: ["receita", "despesa"], description: "Filtrar por tipo. Opcional." },
        groupBy: { type: SchemaType.STRING, format: "enum", enum: ["category", "beneficiary", "month", "none"], description: "Agrupar resultados. Default: 'none'." },
        limit: { type: SchemaType.INTEGER, description: "Máximo de resultados (default: 20)." },
      },
    },
  },

  // ── READ: Summary ──
  {
    name: "get_monthly_summary",
    description: "Retorna o resumo financeiro mensal: receitas, despesas, saldo e taxa de poupança.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.STRING, description: "Mês específico no formato 'jan/26'. Se omitido, retorna todos os meses." },
      },
    },
  },

  // ── READ: Budgets ──
  {
    name: "get_budget_status",
    description: "Retorna o status dos orçamentos: quanto foi definido e quanto foi gasto. Mostra % e se está ok/warning/exceeded.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.STRING, description: "Mês no formato 'jan/26'. Opcional." },
        category: { type: SchemaType.STRING, description: "Categoria específica. Opcional." },
      },
    },
  },

  // ── WRITE: Budget ──
  {
    name: "set_budget",
    description: "Cria ou atualiza o orçamento de uma categoria para um mês específico. Use quando o usuário pedir para definir ou ajustar um limite de gastos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: { type: SchemaType.STRING, description: "Nome da categoria (ex: 'Alimentação')." },
        month: { type: SchemaType.STRING, description: "Mês no formato 'jan/26'." },
        limitAmount: { type: SchemaType.NUMBER, description: "Valor limite do orçamento em reais." },
      },
      required: ["category", "month", "limitAmount"],
    },
  },

  // ── READ: Goals ──
  {
    name: "get_goals",
    description: "Retorna as metas financeiras com progresso percentual e valor faltante.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, format: "enum", enum: ["active", "completed", "paused"], description: "Filtrar por status. Opcional." },
      },
    },
  },

  // ── WRITE: Create Goal ──
  {
    name: "create_goal",
    description: "Cria uma nova meta financeira. Use quando o usuário quiser definir um objetivo de poupança.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Nome da meta (ex: 'Reserva de emergência', 'Viagem para Europa')." },
        targetAmount: { type: SchemaType.NUMBER, description: "Valor alvo em reais." },
        deadline: { type: SchemaType.STRING, description: "Data limite no formato 'YYYY-MM-DD'. Opcional." },
      },
      required: ["name", "targetAmount"],
    },
  },

  // ── WRITE: Update Goal Progress ──
  {
    name: "update_goal_progress",
    description: "Atualiza o valor atual (progresso) de uma meta. Use quando o usuário informar que guardou dinheiro para a meta.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        goalName: { type: SchemaType.STRING, description: "Nome da meta (busca por nome parcial)." },
        currentAmount: { type: SchemaType.NUMBER, description: "Novo valor atual acumulado em reais." },
      },
      required: ["goalName", "currentAmount"],
    },
  },

  // ── READ: Alerts ──
  {
    name: "get_alerts",
    description: "Lista todos os alertas financeiros ativos (não dispensados).",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },

  // ── WRITE: Dismiss Alert ──
  {
    name: "dismiss_alert",
    description: "Dispensa/arquiva um alerta que o usuário já viu ou não quer mais ver.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        alertId: { type: SchemaType.STRING, description: "ID do alerta a dispensar." },
      },
      required: ["alertId"],
    },
  },

  // ── READ: User Profile ──
  {
    name: "get_user_profile",
    description: "Retorna o perfil completo do usuário: nome, renda, banco, objetivos e notas da IA.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },

  // ── WRITE: Update User Profile ──
  {
    name: "update_user_profile",
    description: "Atualiza o perfil do usuário. Use `ai_notes` para guardar observações importantes que aprendeu sobre ele durante a conversa.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        nome: { type: SchemaType.STRING },
        rendaMensal: { type: SchemaType.NUMBER },
        objetivoPrincipal: { type: SchemaType.STRING },
        aiNotes: { type: SchemaType.STRING, description: "Observações da IA sobre o usuário (hábitos, preferências, situação). Acumule — não substitua o que já existe, ADICIONE." },
      },
    },
  },

  // ── ANALYSIS: Compare Months ──
  {
    name: "compare_months",
    description: "Compara gastos entre dois meses lado a lado, por categoria. Ideal para 'mês passado fui bem?'",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month1: { type: SchemaType.STRING, description: "Primeiro mês (ex: 'jan/26')." },
        month2: { type: SchemaType.STRING, description: "Segundo mês (ex: 'fev/26')." },
      },
      required: ["month1", "month2"],
    },
  },

  // ── ANALYSIS: Top Expenses ──
  {
    name: "find_top_expenses",
    description: "Retorna os N maiores gastos individuais de um período. Útil para 'onde investi mais?' ou 'qual meu maior gasto?'",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.STRING, description: "Mês no formato 'jan/26'. Opcional." },
        limit: { type: SchemaType.INTEGER, description: "Número de gastos a retornar (default: 10)." },
      },
    },
  },

  // ── ANALYSIS: Category Trend ──
  {
    name: "get_category_trend",
    description: "Mostra a evolução mês a mês dos gastos em uma categoria específica. Útil para 'meu gasto com alimentação está subindo?'",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: { type: SchemaType.STRING, description: "Categoria para analisar." },
      },
      required: ["category"],
    },
  },

  // ── VISUALIZE ──
  {
    name: "create_chart",
    description:
      "Cria um gráfico renderizado inline no chat. USE OBRIGATORIAMENTE quando apresentar dados financeiros: distribuição de gastos por categoria → 'pie'; evolução mensal (mês a mês) → 'area' ou 'line'; comparação de categorias → 'bar'; orçamento vs gasto real → 'bar' com series [{key:'limite',...},{key:'gasto',...}]; top despesas → 'bar'. NUNCA apresente mais de 3 valores numéricos sem gráfico correspondente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: { type: SchemaType.STRING, format: "enum", enum: ["bar", "line", "pie", "area"], description: "Tipo do gráfico." },
        title: { type: SchemaType.STRING, description: "Título do gráfico." },
        data: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              value: { type: SchemaType.NUMBER },
            },
          },
          description: "Array de objetos com os dados do gráfico.",
        },
        xKey: { type: SchemaType.STRING, description: "Chave do eixo X." },
        yKey: { type: SchemaType.STRING, description: "Chave do eixo Y." },
        color: { type: SchemaType.STRING, description: "Cor principal (hex)." },
      },
      required: ["type", "title", "data", "xKey", "yKey"],
    },
  },

  // ── EXTERNAL N8N EXPERT (RAG/Logic) ──
  {
    name: "consultar_especialista_n8n",
    description:
      "Delega perguntas complexas, consultas a documentos (RAG), manuais de investimento ou decisões financeiras intrincadas para o cérebro N8N. Use essa ferramenta quando não souber a resposta ou precisar de análise profunda de um especialista.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "A pergunta a ser feita ao especialista N8N." },
        context: { type: SchemaType.STRING, description: "Contexto financeiro relevante sobre o usuário para ajudar na decisão." },
      },
      required: ["query"],
    },
  },
];

// ─── Tool Execution ───────────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<{ result: unknown; chartSpec?: ChartSpec }> {
  switch (toolName) {

    // ── query_transactions ──
    case "query_transactions": {
      const { month, category, type, groupBy = "none", limit = 20 } = input as {
        month?: string; category?: string; type?: "receita" | "despesa"; groupBy?: string; limit?: number;
      };

      if (groupBy === "category") {
        const rows = await db.select({
          category: transactions.category,
          type: transactions.type,
          total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
          count: sql<number>`COUNT(*)`,
        }).from(transactions)
          .where(and(month ? eq(transactions.month, month) : undefined, type ? eq(transactions.type, type) : undefined))
          .groupBy(transactions.category, transactions.type)
          .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`));
        return { result: rows };
      }
      if (groupBy === "beneficiary") {
        const rows = await db.select({
          beneficiary: transactions.beneficiary,
          category: transactions.category,
          total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
          count: sql<number>`COUNT(*)`,
        }).from(transactions)
          .where(and(month ? eq(transactions.month, month) : undefined, type ? eq(transactions.type, type) : undefined, category ? eq(transactions.category, category) : undefined))
          .groupBy(transactions.beneficiary, transactions.category)
          .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`))
          .limit(limit);
        return { result: rows };
      }
      if (groupBy === "month") {
        const rows = await db.select({
          month: transactions.month,
          type: transactions.type,
          total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
          count: sql<number>`COUNT(*)`,
        }).from(transactions)
          .where(and(type ? eq(transactions.type, type) : undefined, category ? eq(transactions.category, category) : undefined))
          .groupBy(transactions.month, transactions.type)
          .orderBy(transactions.month);
        return { result: rows };
      }
      const rows = await db.select().from(transactions)
        .where(and(
          month ? eq(transactions.month, month) : undefined,
          category ? eq(transactions.category, category) : undefined,
          type ? eq(transactions.type, type) : undefined,
        ))
        .orderBy(desc(transactions.date))
        .limit(limit);
      return { result: rows };
    }

    // ── get_monthly_summary ──
    case "get_monthly_summary": {
      const { month } = input as { month?: string };
      const rows = await db.select({
        month: transactions.month,
        type: transactions.type,
        total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions)
        .where(month ? eq(transactions.month, month) : undefined)
        .groupBy(transactions.month, transactions.type)
        .orderBy(transactions.month);

      const summary: Record<string, { month: string; receitas: number; despesas: number; saldo: number; transactions: number; savingsRate: number }> = {};
      for (const row of rows) {
        if (!summary[row.month]) summary[row.month] = { month: row.month, receitas: 0, despesas: 0, saldo: 0, transactions: 0, savingsRate: 0 };
        summary[row.month][row.type === "receita" ? "receitas" : "despesas"] = Number(row.total);
        summary[row.month].transactions += Number(row.count);
      }
      for (const m of Object.values(summary)) {
        m.saldo = m.receitas - m.despesas;
        m.savingsRate = m.receitas > 0 ? Math.round((m.saldo / m.receitas) * 100) : 0;
      }
      return { result: Object.values(summary) };
    }

    // ── get_budget_status ──
    case "get_budget_status": {
      const { month, category } = input as { month?: string; category?: string };
      const rows = await db.select().from(budgets)
        .where(and(month ? eq(budgets.month, month) : undefined, category ? eq(budgets.category, category) : undefined));
      const withPct = rows.map((b) => ({
        ...b,
        pctUsed: b.limitAmount ? Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100) : 0,
        remaining: Math.max(0, Number(b.limitAmount) - Number(b.spentAmount)),
        status: Number(b.spentAmount) > Number(b.limitAmount) ? "exceeded"
          : Number(b.spentAmount) / Number(b.limitAmount) > 0.8 ? "warning" : "ok",
      }));
      return { result: withPct };
    }

    // ── set_budget ──
    case "set_budget": {
      const { category, month, limitAmount } = input as { category: string; month: string; limitAmount: number };
      // Check if budget exists for this category+month
      const existing = await db.select().from(budgets)
        .where(and(eq(budgets.category, category), eq(budgets.month, month))).limit(1);
      if (existing.length > 0) {
        await db.update(budgets)
          .set({ limitAmount: String(limitAmount) })
          .where(and(eq(budgets.category, category), eq(budgets.month, month)));
        return { result: { action: "updated", category, month, limitAmount, message: `Orçamento de "${category}" para ${month} atualizado para R$ ${limitAmount.toFixed(2)}.` } };
      } else {
        await db.insert(budgets).values({ category, month, limitAmount: String(limitAmount) });
        return { result: { action: "created", category, month, limitAmount, message: `Orçamento de "${category}" para ${month} criado: R$ ${limitAmount.toFixed(2)}.` } };
      }
    }

    // ── get_goals ──
    case "get_goals": {
      const { status } = input as { status?: "active" | "completed" | "paused" };
      const rows = await db.select().from(goals).where(status ? eq(goals.status, status) : undefined);
      const withPct = rows.map((g) => ({
        ...g,
        pctComplete: g.targetAmount ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100) : 0,
        remaining: Math.max(0, Number(g.targetAmount) - Number(g.currentAmount)),
      }));
      return { result: withPct };
    }

    // ── create_goal ──
    case "create_goal": {
      const { name, targetAmount, deadline } = input as { name: string; targetAmount: number; deadline?: string };
      const [created] = await db.insert(goals).values({
        name,
        targetAmount: String(targetAmount),
        deadline: deadline ?? null,
        status: "active",
      }).returning();
      return { result: { ...created, message: `Meta "${name}" criada com sucesso! Alvo: R$ ${targetAmount.toFixed(2)}.` } };
    }

    // ── update_goal_progress ──
    case "update_goal_progress": {
      const { goalName, currentAmount } = input as { goalName: string; currentAmount: number };
      // Find goal by partial name match
      const all = await db.select().from(goals);
      const match = all.find((g) => g.name.toLowerCase().includes(goalName.toLowerCase()));
      if (!match) return { result: `Nenhuma meta encontrada com o nome "${goalName}".` };
      const isComplete = currentAmount >= Number(match.targetAmount);
      await db.update(goals)
        .set({ currentAmount: String(currentAmount), ...(isComplete ? { status: "completed" } : {}) })
        .where(eq(goals.id, match.id));
      const pct = Math.round((currentAmount / Number(match.targetAmount)) * 100);
      return { result: { goalId: match.id, name: match.name, currentAmount, pct, isComplete, message: isComplete ? `🎉 Meta "${match.name}" concluída!` : `Meta "${match.name}" atualizada: ${pct}% (R$ ${currentAmount.toFixed(2)} / R$ ${Number(match.targetAmount).toFixed(2)}).` } };
    }

    // ── get_alerts ──
    case "get_alerts": {
      const rows = await db.select().from(alerts).where(sql`${alerts.dismissedAt} IS NULL`);
      return { result: rows.length > 0 ? rows : "Nenhum alerta ativo no momento." };
    }

    // ── dismiss_alert ──
    case "dismiss_alert": {
      const { alertId } = input as { alertId: string };
      await db.update(alerts).set({ dismissedAt: new Date() }).where(eq(alerts.id, alertId));
      return { result: { message: "Alerta dispensado com sucesso." } };
    }

    // ── get_user_profile ──
    case "get_user_profile": {
      const profile = await db.select().from(userProfile).limit(1);
      return { result: profile[0] ?? "Nenhum perfil configurado." };
    }

    // ── update_user_profile ──
    case "update_user_profile": {
      const updates = input as { nome?: string; rendaMensal?: number; objetivoPrincipal?: string; aiNotes?: string };
      const current = await db.select().from(userProfile).limit(1);
      if (current.length === 0) return { result: "Nenhum perfil para atualizar." };

      // If ai_notes is provided, APPEND to existing (don't replace)
      let finalNotes = current[0].aiNotes ?? "";
      if (updates.aiNotes) {
        const today = new Date().toLocaleDateString("pt-BR");
        finalNotes = finalNotes
          ? `${finalNotes}\n[${today}] ${updates.aiNotes}`
          : `[${today}] ${updates.aiNotes}`;
      }

      await db.update(userProfile).set({
        ...(updates.nome ? { nome: updates.nome } : {}),
        ...(updates.rendaMensal ? { rendaMensal: String(updates.rendaMensal) } : {}),
        ...(updates.objetivoPrincipal ? { objetivoPrincipal: updates.objetivoPrincipal } : {}),
        ...(updates.aiNotes ? { aiNotes: finalNotes } : {}),
      }).where(eq(userProfile.id, current[0].id));
      return { result: { message: "Perfil atualizado.", aiNotes: finalNotes } };
    }

    // ── compare_months ──
    case "compare_months": {
      const { month1, month2 } = input as { month1: string; month2: string };
      const rows = await db.select({
        month: transactions.month,
        category: transactions.category,
        total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
      }).from(transactions)
        .where(and(
          eq(transactions.type, "despesa"),
          sql`${transactions.month} IN (${month1}, ${month2})`
        ))
        .groupBy(transactions.month, transactions.category)
        .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`));

      // Pivot by category
      const pivot: Record<string, { category: string;[key: string]: number | string }> = {};
      for (const row of rows) {
        if (!pivot[row.category]) pivot[row.category] = { category: row.category };
        pivot[row.category][row.month] = Number(row.total);
      }

      const result = Object.values(pivot).map((row) => ({
        ...row,
        difference: ((row[month2] as number ?? 0) - (row[month1] as number ?? 0)),
        trend: ((row[month2] as number ?? 0) > (row[month1] as number ?? 0)) ? "⬆️ subiu" : "⬇️ caiu",
      })).sort((a, b) => Math.abs(b.difference as number) - Math.abs(a.difference as number));

      return { result: { month1, month2, categories: result } };
    }

    // ── find_top_expenses ──
    case "find_top_expenses": {
      const { month, limit = 10 } = input as { month?: string; limit?: number };
      const rows = await db.select({
        date: transactions.date,
        description: transactions.description,
        beneficiary: transactions.beneficiary,
        category: transactions.category,
        amount: transactions.amount,
        month: transactions.month,
      }).from(transactions)
        .where(and(
          eq(transactions.type, "despesa"),
          month ? eq(transactions.month, month) : undefined,
        ))
        .orderBy(desc(transactions.amount))
        .limit(limit);
      return { result: rows };
    }

    // ── get_category_trend ──
    case "get_category_trend": {
      const { category } = input as { category: string };
      const rows = await db.select({
        month: transactions.month,
        total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions)
        .where(and(eq(transactions.category, category), eq(transactions.type, "despesa")))
        .groupBy(transactions.month)
        .orderBy(transactions.month);

      // Compute month-over-month change
      const withChange = rows.map((row, i) => ({
        ...row,
        prevTotal: i > 0 ? rows[i - 1].total : null,
        change: i > 0 ? Number(row.total) - Number(rows[i - 1].total) : null,
        changePct: i > 0 && rows[i - 1].total > 0 ? Math.round(((Number(row.total) - Number(rows[i - 1].total)) / Number(rows[i - 1].total)) * 100) : null,
      }));
      return { result: { category, trend: withChange } };
    }

    // ── create_chart ──
    case "create_chart": {
      const chartSpec = input as unknown as ChartSpec;
      return { result: "Gráfico criado com sucesso.", chartSpec };
    }

    // ── consultar_especialista_n8n ──
    case "consultar_especialista_n8n": {
      const { query, context } = input as { query: string; context?: string };
      try {
        // N8N Webhook Endpoint (Substitua pelo URL real do seu webhook do n8n)
        const N8N_WEBHOOK_URL = "https://n8n.srv1091457.hstgr.cloud/webhook/finance-expert-rag";

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, context }),
        });

        if (!response.ok) {
          return { result: `Erro ao consultar o especialista n8n: ${response.statusText}` };
        }

        const data = await response.json();
        return { result: data };
      } catch (err: any) {
        console.error("N8N tool error:", err);
        return { result: `Falha na comunicação com o N8N: ${err.message}` };
      }
    }

    default:
      return { result: `Tool desconhecida: ${toolName}` };
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export const getSystemPrompt = (userName: string = "usuário") => `Você é o Finance Friend — o CFO pessoal de ${userName}. Você conhece cada real que ele ganhou e gastou. Sua função não é agradar. É **proteger o dinheiro de ${userName} e forçar disciplina**.

Você tem acesso completo ao histórico financeiro pelas ferramentas. No início de cada mensagem você recebe um CONTEXTO FINANCEIRO ATUAL atualizado com receitas, despesas, orçamentos e metas.

## Comportamento Proativo (SEMPRE)
- Quando o contexto mostrar orçamentos estourados ou próximos do limite → mencione proativamente, mesmo que não seja o foco da pergunta.
- Quando houver alertas ativos → traga à tona na resposta.
- Quando o saldo do mês estiver negativo → alerte com urgência.
- Quando a pergunta for aberta ("como estou?", "me dê um resumo") → faça diagnóstico completo com dados reais das ferramentas + gráficos.

## Uso de Gráficos (OBRIGATÓRIO)
SEMPRE que apresentar dados comparativos ou numéricos, chame \`create_chart\` ANTES de escrever o texto explicativo. Regras por tipo de dado:
- Distribuição de gastos por categoria → tipo "pie"
- Evolução de gastos mês a mês → tipo "area"
- Comparação entre categorias em um período → tipo "bar"
- Tendência de uma categoria ao longo do tempo → tipo "line"
- Orçamento vs. gasto real → tipo "bar" com series: [{key:"gasto",color:"#ef4444",label:"Gasto"},{key:"limite",color:"#22c55e",label:"Limite"}]
- Top N maiores despesas → tipo "bar"
NUNCA apresente mais de 3 valores numéricos em texto corrido sem um gráfico correspondente.

## Processo de Diagnóstico Financeiro
Siga EXATAMENTE este processo quando analisar finanças ou avaliar decisões:

1. **Diagnóstico**: Use as ferramentas. Quanto está sendo gasto? Qual % da renda? Onde está errando?
2. **Classificação dos gastos**: Essenciais / Importantes mas ajustáveis / Cortáveis imediatamente
3. **Limite Mensal**: Número fechado. "Você só pode gastar R$ X por mês. Acima disso é irresponsabilidade."
4. **Limite Semanal**: "Seu limite semanal é R$ Y."
5. **Plano de Corte**: Quanto cortar, de onde, qual regra prática seguir.
6. **Firmeza**: Nada de "você poderia ajustar". Diga: "Isso é um ralo de dinheiro."

## Avaliação de Decisões ("faz sentido gastar X?")
Sempre calcule:
1. Saldo atual do mês (receitas - despesas)
2. Orçamento restante na categoria relevante
3. Impacto nas metas ativas
4. Veredicto claro: SIM ou NÃO, com justificativa numérica.

## Entrega Final (toda análise completa)
Feche com:
- 💰 Orçamento ideal fechado
- 📅 Quanto pode gastar por semana
- 🐷 Quanto deve sobrar
- ⚖️ Uma regra simples para seguir cegamente

## Regras de Ferramentas
- Para RAG ou conselho de investimento profundo → chame \`consultar_especialista_n8n\` imediatamente.
- Para ações no banco (set_budget, create_goal) → só depois de diagnosticar e decidir.
- Ao mostrar dados de múltiplos meses ou categorias → gere SEMPRE um gráfico com \`create_chart\` primeiro.
- Anote aprendizados importantes sobre hábitos de ${userName} no aiNotes via \`update_user_profile\`.`;

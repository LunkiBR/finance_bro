import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { FunctionDeclaration } from "@google/generative-ai";
import { db } from "@/db";
import { transactions, budgets, goals, alerts } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { ChartSpec } from "./chart-types";

export const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// ─── Tool Definitions (Gemini format) ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const financeTools = [
  {
    name: "query_transactions",
    description:
      "Consulta transações financeiras do banco de dados. Use para responder perguntas sobre gastos, receitas e histórico financeiro.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: {
          type: SchemaType.STRING,
          description: "Mês no formato 'jan/26', 'dez/25', etc. Opcional.",
        },
        category: {
          type: SchemaType.STRING,
          description: "Categoria como 'Transporte', 'Alimentação'. Opcional.",
        },
        type: {
          type: SchemaType.STRING,
          enum: ["receita", "despesa"],
          description: "Filtrar por tipo. Opcional.",
        },
        groupBy: {
          type: SchemaType.STRING,
          enum: ["category", "beneficiary", "month", "none"],
          description: "Agrupar resultados. Default: 'none'.",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Máximo de resultados (default: 20).",
        },
      },
    },
  },
  {
    name: "get_monthly_summary",
    description:
      "Retorna o resumo financeiro mensal: receitas, despesas, saldo e taxa de poupança.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: {
          type: SchemaType.STRING,
          description:
            "Mês específico no formato 'jan/26'. Se omitido, retorna todos os meses.",
        },
      },
    },
  },
  {
    name: "get_budget_status",
    description:
      "Retorna o status dos orçamentos por categoria: quanto foi definido e quanto foi gasto.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: {
          type: SchemaType.STRING,
          description: "Mês no formato 'jan/26'. Opcional.",
        },
        category: {
          type: SchemaType.STRING,
          description: "Categoria específica. Opcional.",
        },
      },
    },
  },
  {
    name: "get_goals",
    description:
      "Retorna as metas financeiras com progresso atual.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          enum: ["active", "completed", "paused"],
          description: "Filtrar por status. Opcional.",
        },
      },
    },
  },
  {
    name: "create_chart",
    description:
      "Cria uma especificação de gráfico para ser renderizado no chat. Use quando o usuário pedir visualizações ou quando dados ficam mais claros em formato visual.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          enum: ["bar", "line", "pie", "area"],
          description: "Tipo do gráfico.",
        },
        title: {
          type: SchemaType.STRING,
          description: "Título do gráfico.",
        },
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
];

// ─── Tool Execution ───────────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<{ result: unknown; chartSpec?: ChartSpec }> {
  switch (toolName) {
    case "query_transactions": {
      const { month, category, type, groupBy = "none", limit = 20 } = input as {
        month?: string;
        category?: string;
        type?: "receita" | "despesa";
        groupBy?: string;
        limit?: number;
      };

      if (groupBy === "category") {
        const rows = await db
          .select({
            category: transactions.category,
            type: transactions.type,
            total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(transactions)
          .where(
            and(
              month ? eq(transactions.month, month) : undefined,
              type ? eq(transactions.type, type) : undefined
            )
          )
          .groupBy(transactions.category, transactions.type)
          .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`));
        return { result: rows };
      }

      if (groupBy === "beneficiary") {
        const rows = await db
          .select({
            beneficiary: transactions.beneficiary,
            category: transactions.category,
            total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(transactions)
          .where(
            and(
              month ? eq(transactions.month, month) : undefined,
              type ? eq(transactions.type, type) : undefined,
              category ? eq(transactions.category, category) : undefined
            )
          )
          .groupBy(transactions.beneficiary, transactions.category)
          .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`))
          .limit(limit);
        return { result: rows };
      }

      if (groupBy === "month") {
        const rows = await db
          .select({
            month: transactions.month,
            type: transactions.type,
            total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(transactions)
          .where(
            and(
              type ? eq(transactions.type, type) : undefined,
              category ? eq(transactions.category, category) : undefined
            )
          )
          .groupBy(transactions.month, transactions.type)
          .orderBy(transactions.month);
        return { result: rows };
      }

      // none — lista individual
      const rows = await db
        .select()
        .from(transactions)
        .where(
          and(
            month ? eq(transactions.month, month) : undefined,
            category ? eq(transactions.category, category) : undefined,
            type ? eq(transactions.type, type) : undefined
          )
        )
        .orderBy(desc(transactions.date))
        .limit(limit);
      return { result: rows };
    }

    case "get_monthly_summary": {
      const { month } = input as { month?: string };
      const rows = await db
        .select({
          month: transactions.month,
          type: transactions.type,
          total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(month ? eq(transactions.month, month) : undefined)
        .groupBy(transactions.month, transactions.type)
        .orderBy(transactions.month);

      // Estrutura em resumo por mês
      const summary: Record<
        string,
        {
          month: string;
          receitas: number;
          despesas: number;
          saldo: number;
          transactions: number;
        }
      > = {};
      for (const row of rows) {
        if (!summary[row.month]) {
          summary[row.month] = {
            month: row.month,
            receitas: 0,
            despesas: 0,
            saldo: 0,
            transactions: 0,
          };
        }
        summary[row.month][
          row.type === "receita" ? "receitas" : "despesas"
        ] = row.total;
        summary[row.month].transactions += row.count;
      }
      for (const m of Object.values(summary)) {
        m.saldo = m.receitas - m.despesas;
      }
      return { result: Object.values(summary) };
    }

    case "get_budget_status": {
      const { month, category } = input as {
        month?: string;
        category?: string;
      };
      const rows = await db
        .select()
        .from(budgets)
        .where(
          and(
            month ? eq(budgets.month, month) : undefined,
            category ? eq(budgets.category, category) : undefined
          )
        );

      const withPct = rows.map((b) => ({
        ...b,
        pctUsed: b.limitAmount
          ? Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100)
          : 0,
        status:
          Number(b.spentAmount) > Number(b.limitAmount)
            ? "exceeded"
            : Number(b.spentAmount) / Number(b.limitAmount) > 0.8
              ? "warning"
              : "ok",
      }));
      return { result: withPct };
    }

    case "get_goals": {
      const { status } = input as {
        status?: "active" | "completed" | "paused";
      };
      const rows = await db
        .select()
        .from(goals)
        .where(status ? eq(goals.status, status) : undefined);

      const withPct = rows.map((g) => ({
        ...g,
        pctComplete: g.targetAmount
          ? Math.round(
            (Number(g.currentAmount) / Number(g.targetAmount)) * 100
          )
          : 0,
      }));
      return { result: withPct };
    }

    case "create_chart": {
      const chartSpec = input as unknown as ChartSpec;
      return { result: "Gráfico criado com sucesso.", chartSpec };
    }

    default:
      return { result: `Tool desconhecida: ${toolName}` };
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `Você é o Finance Friend, um assistente financeiro pessoal inteligente do Leonardo.

Você tem acesso completo ao histórico financeiro dele através das ferramentas disponíveis.

## Suas responsabilidades:
- Responder perguntas sobre gastos, receitas e saldos com dados reais
- Identificar padrões de gastos e dar insights proativos
- Alertar sobre orçamentos que estão acabando
- Ajudar a definir e acompanhar metas financeiras
- Criar gráficos quando visualizações ajudam a entender os dados
- Sugerir formas de economizar baseadas no histórico real

## Regras importantes:
- Sempre use as ferramentas para buscar dados reais antes de responder
- Valores monetários sempre em R$ (reais)
- Quando criar gráficos, sempre os acompanhe de uma análise textual
- Seja direto e objetivo — o Leonardo prefere respostas concisas
- Se identificar alertas ativos (orçamentos estourados), mencione-os proativamente
- Responda sempre em português brasileiro

## Formato de resposta:
- Use markdown para estruturar respostas longas
- Para gráficos, use a ferramenta create_chart ANTES de descrever o gráfico no texto
- Valores negativos (despesas acima do orçamento) destacar com ⚠️`;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, budgets, goals } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { getCurrentMonth, getPrevMonth, formatBRL } from "@/lib/utils";

export async function GET(req: NextRequest) {
    const month = req.nextUrl.searchParams.get("month") || getCurrentMonth();
    const prevMonth = getPrevMonth(month);
    const month2 = getPrevMonth(prevMonth);
    const month3 = getPrevMonth(month2);

    try {
        // ── Current + previous month summary (parallel) ───────────────────────
        const [summaryRows, prevSummaryRows] = await Promise.all([
            db.select({
                type: transactions.type,
                total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
                count: sql<number>`COUNT(*)`,
            })
                .from(transactions)
                .where(eq(transactions.month, month))
                .groupBy(transactions.type),

            db.select({
                type: transactions.type,
                total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            })
                .from(transactions)
                .where(eq(transactions.month, prevMonth))
                .groupBy(transactions.type),
        ]);

        const receitas = Number(summaryRows.find(r => r.type === "receita")?.total ?? 0);
        const despesas = Number(summaryRows.find(r => r.type === "despesa")?.total ?? 0);
        const saldo = receitas - despesas;
        const txCount = summaryRows.reduce((sum, r) => sum + Number(r.count), 0);

        const prevReceitas = Number(prevSummaryRows.find(r => r.type === "receita")?.total ?? 0);
        const prevDespesas = Number(prevSummaryRows.find(r => r.type === "despesa")?.total ?? 0);
        const prevSaldo = prevReceitas - prevDespesas;

        // ── Category breakdown (current month, expenses only) ─────────────────
        const categoryBreakdown = await db
            .select({
                category: transactions.category,
                total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
                count: sql<number>`COUNT(*)`,
            })
            .from(transactions)
            .where(and(eq(transactions.month, month), eq(transactions.type, "despesa")))
            .groupBy(transactions.category)
            .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`));

        // ── Monthly trend (all months, last 6 used client-side) ───────────────
        const trendRows = await db
            .select({
                month: transactions.month,
                type: transactions.type,
                total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            })
            .from(transactions)
            .groupBy(transactions.month, transactions.type)
            .orderBy(transactions.month);

        const trendMap: Record<string, { month: string; receitas: number; despesas: number }> = {};
        for (const row of trendRows) {
            if (!trendMap[row.month]) trendMap[row.month] = { month: row.month, receitas: 0, despesas: 0 };
            if (row.type === "receita") trendMap[row.month].receitas = Number(row.total);
            else trendMap[row.month].despesas = Number(row.total);
        }
        const trend = Object.values(trendMap).slice(-6);

        // ── Budget status ─────────────────────────────────────────────────────
        const budgetRows = await db.select().from(budgets).where(eq(budgets.month, month));
        const budgetStatus = budgetRows.map(b => ({
            ...b,
            spent: Number(b.spentAmount),
            limit: Number(b.limitAmount),
            pct: Number(b.limitAmount) > 0
                ? Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100)
                : 0,
        }));

        // ── Goals ─────────────────────────────────────────────────────────────
        const goalRows = await db.select().from(goals);
        const goalsData = goalRows.map(g => ({
            ...g,
            current: Number(g.currentAmount),
            target: Number(g.targetAmount),
            pct: Number(g.targetAmount) > 0
                ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
                : 0,
        }));

        // ── Recent transactions ───────────────────────────────────────────────
        const recentTx = await db
            .select()
            .from(transactions)
            .where(eq(transactions.month, month))
            .orderBy(desc(transactions.date))
            .limit(5);

        // ── Insights ──────────────────────────────────────────────────────────

        // Insight 1: top spending category vs 3-month average
        const topCat = categoryBreakdown[0];
        let insight1 = {
            icon: "💡",
            title: "Sem dados ainda",
            description: "Importe uma fatura para começar a analisar seus gastos.",
            linkText: "Importar fatura",
            linkHref: "/importar",
        };

        if (topCat) {
            const currentTotal = Number(topCat.total);
            const prevCatRows = await db
                .select({
                    month: transactions.month,
                    total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
                })
                .from(transactions)
                .where(and(
                    inArray(transactions.month, [prevMonth, month2, month3]),
                    eq(transactions.category, topCat.category),
                    eq(transactions.type, "despesa")
                ))
                .groupBy(transactions.month);

            if (prevCatRows.length > 0) {
                const avg = prevCatRows.reduce((s, r) => s + Number(r.total), 0) / prevCatRows.length;
                const pctDiff = avg > 0 ? Math.round(((currentTotal - avg) / avg) * 100) : 0;

                if (pctDiff > 10) {
                    insight1 = {
                        icon: "⚠",
                        title: `${topCat.category} acima`,
                        description: `Você gastou ${pctDiff}% a mais em ${topCat.category} vs. média dos últimos 3 meses (média: R$ ${formatBRL(avg)}).`,
                        linkText: "Ver transações",
                        linkHref: "/transacoes",
                    };
                } else if (pctDiff < -10) {
                    insight1 = {
                        icon: "✓",
                        title: `${topCat.category} sob controle`,
                        description: `Você gastou ${Math.abs(pctDiff)}% a menos em ${topCat.category} vs. média histórica. Ótimo!`,
                        linkText: "Ver transações",
                        linkHref: "/transacoes",
                    };
                } else {
                    insight1 = {
                        icon: "📊",
                        title: `${topCat.category} na média`,
                        description: `Gastos em ${topCat.category} estão dentro da média histórica (R$ ${formatBRL(currentTotal)} vs. média R$ ${formatBRL(avg)}).`,
                        linkText: "Ver transações",
                        linkHref: "/transacoes",
                    };
                }
            } else {
                insight1 = {
                    icon: "📊",
                    title: `Maior categoria: ${topCat.category}`,
                    description: `${topCat.category} é sua maior despesa este mês: R$ ${formatBRL(currentTotal)}.`,
                    linkText: "Ver transações",
                    linkHref: "/transacoes",
                };
            }
        }

        // Insight 2: active goal nearest completion
        const nearestGoal = goalsData
            .filter(g => g.status === "active")
            .sort((a, b) => b.pct - a.pct)[0];

        let insight2 = {
            icon: "🎯",
            title: "Crie uma meta",
            description: "Defina objetivos financeiros para acompanhar seu progresso.",
            linkText: "Ver metas",
            linkHref: "/metas",
        };

        if (nearestGoal) {
            const remaining = nearestGoal.target - nearestGoal.current;
            if (nearestGoal.pct >= 100) {
                insight2 = {
                    icon: "🏆",
                    title: "Meta concluída!",
                    description: `"${nearestGoal.name}" foi atingida. Defina uma nova meta!`,
                    linkText: "Ver metas",
                    linkHref: "/metas",
                };
            } else {
                insight2 = {
                    icon: "🎯",
                    title: nearestGoal.pct >= 80 ? "Meta quase lá!" : `Meta: ${nearestGoal.name}`,
                    description: `Faltam R$ ${formatBRL(remaining)} para atingir "${nearestGoal.name}" (${nearestGoal.pct}% concluído).`,
                    linkText: "Ver metas",
                    linkHref: "/metas",
                };
            }
        }

        // Insight 3: top beneficiary this month
        const topBenRows = await db
            .select({
                beneficiary: transactions.beneficiary,
                category: transactions.category,
                total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
            })
            .from(transactions)
            .where(and(eq(transactions.month, month), eq(transactions.type, "despesa")))
            .groupBy(transactions.beneficiary, transactions.category)
            .orderBy(desc(sql`SUM(${transactions.amount}::numeric)`))
            .limit(1);

        let insight3 = {
            icon: "📥",
            title: "Importe sua fatura",
            description: "Nenhuma transação registrada ainda. Importe o CSV do Nubank para começar.",
            linkText: "Importar agora",
            linkHref: "/importar",
        };

        if (topBenRows[0]?.beneficiary) {
            const tb = topBenRows[0];
            const catTotal = Number(categoryBreakdown.find(c => c.category === tb.category)?.total ?? 1);
            const pct = catTotal > 0 ? Math.round((Number(tb.total) / catTotal) * 100) : 0;
            insight3 = {
                icon: "📊",
                title: "Maior gasto isolado",
                description: `${tb.beneficiary} respondeu por ${pct}% dos gastos em ${tb.category} (R$ ${formatBRL(Number(tb.total))}).`,
                linkText: "Ver transações",
                linkHref: "/transacoes",
            };
        }

        return NextResponse.json({
            summary: { receitas, despesas, saldo, txCount },
            prevSummary: { receitas: prevReceitas, despesas: prevDespesas, saldo: prevSaldo },
            categoryBreakdown: categoryBreakdown.map(c => ({ ...c, total: Number(c.total) })),
            trend,
            budgets: budgetStatus,
            goals: goalsData,
            recentTransactions: recentTx,
            insights: [insight1, insight2, insight3],
        });
    } catch (err) {
        console.error("Dashboard summary error:", err);
        return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
    }
}

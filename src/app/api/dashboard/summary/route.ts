import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, budgets, goals, aiSummaries } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentMonth, getPrevMonth, formatBRL, monthToNum } from "@/lib/utils";
import { requireAuth } from "@/lib/auth-guard";
import { safeDecrypt, safeDecryptNumber } from "@/lib/encryption";

const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseMonth(month: string): { year: number; monthIdx: number } {
    const [m, y] = month.split('/');
    return { year: 2000 + parseInt(y), monthIdx: PT_MONTHS.indexOf(m) };
}

function daysInMonth(year: number, monthIdx: number): number {
    return new Date(year, monthIdx + 1, 0).getDate();
}

// ── Decrypted transaction helper ────────────────────────────────────────────

type DecTx = {
    id: string;
    type: string;
    category: string;
    subcategory: string | null;
    month: string;
    date: string;
    description: string;
    beneficiary: string;
    amount: number;
    source: string;
};

function decryptTx(row: typeof transactions.$inferSelect): DecTx {
    return {
        id: row.id,
        type: row.type,
        category: row.category,
        subcategory: row.subcategory,
        month: row.month,
        date: row.date,
        description: safeDecrypt(row.description),
        beneficiary: safeDecrypt(row.beneficiary),
        amount: safeDecryptNumber(row.amount),
        source: row.source,
    };
}

// ── JS aggregation helpers ──────────────────────────────────────────────────

function sumBy(items: DecTx[]): number {
    return Math.round(items.reduce((s, t) => s + t.amount, 0) * 100) / 100;
}

function groupSum(items: DecTx[], keyFn: (t: DecTx) => string): Record<string, number> {
    const map: Record<string, number> = {};
    for (const t of items) {
        const k = keyFn(t);
        map[k] = (map[k] ?? 0) + t.amount;
    }
    // round all values
    for (const k of Object.keys(map)) map[k] = Math.round(map[k] * 100) / 100;
    return map;
}

function groupCount(items: DecTx[], keyFn: (t: DecTx) => string): Record<string, number> {
    const map: Record<string, number> = {};
    for (const t of items) {
        const k = keyFn(t);
        map[k] = (map[k] ?? 0) + 1;
    }
    return map;
}

export async function GET(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const month = req.nextUrl.searchParams.get("month") || getCurrentMonth();
    const currentMonth = getCurrentMonth();
    const prevMonth = getPrevMonth(month);
    const month2 = getPrevMonth(prevMonth);
    const month3 = getPrevMonth(month2);

    try {
        // ── Fetch ALL user transactions once, decrypt in JS ─────────────────
        const allTxRows = await db.select().from(transactions).where(eq(transactions.userId, userId));
        const allTx = allTxRows.map(decryptTx);

        // ── Filtered subsets ────────────────────────────────────────────────
        const monthTx = allTx.filter(t => t.month === month);
        const prevMonthTx = allTx.filter(t => t.month === prevMonth);
        const monthExpenses = monthTx.filter(t => t.type === "despesa");
        const prevMonthExpenses = prevMonthTx.filter(t => t.type === "despesa");

        // ── Current + previous month summary ────────────────────────────────
        const receitas = Math.round(sumBy(monthTx.filter(t => t.type === "receita")) * 100) / 100;
        const despesas = Math.round(sumBy(monthExpenses) * 100) / 100;
        const saldo = Math.round((receitas - despesas) * 100) / 100;
        const txCount = monthTx.length;

        const prevReceitas = Math.round(sumBy(prevMonthTx.filter(t => t.type === "receita")) * 100) / 100;
        const prevDespesas = Math.round(sumBy(prevMonthExpenses) * 100) / 100;
        const prevSaldo = Math.round((prevReceitas - prevDespesas) * 100) / 100;

        // ── Category breakdown (current month, expenses only) ───────────────
        const catSumMap = groupSum(monthExpenses, t => t.category);
        const catCountMap = groupCount(monthExpenses, t => t.category);
        const categoryBreakdown = Object.entries(catSumMap)
            .map(([category, total]) => ({ category, total, count: catCountMap[category] ?? 0 }))
            .sort((a, b) => b.total - a.total);

        // ── Monthly trend (all months) ──────────────────────────────────────
        const trendMap: Record<string, { month: string; receitas: number; despesas: number }> = {};
        for (const t of allTx) {
            if (!trendMap[t.month]) trendMap[t.month] = { month: t.month, receitas: 0, despesas: 0 };
            if (t.type === "receita") trendMap[t.month].receitas += t.amount;
            else trendMap[t.month].despesas += t.amount;
        }
        // round
        for (const v of Object.values(trendMap)) {
            v.receitas = Math.round(v.receitas * 100) / 100;
            v.despesas = Math.round(v.despesas * 100) / 100;
        }
        const trend = Object.values(trendMap)
            .sort((a, b) => monthToNum(a.month) - monthToNum(b.month))
            .slice(-6);

        // ── Budget status ───────────────────────────────────────────────────
        const budgetRows = await db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.month, month)));
        const budgetStatus = budgetRows.map(b => {
            const spent = safeDecryptNumber(b.spentAmount);
            const limit = safeDecryptNumber(b.limitAmount);
            return {
                ...b,
                spentAmount: String(spent),
                limitAmount: String(limit),
                spent,
                limit,
                pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
            };
        });

        // ── Goals ───────────────────────────────────────────────────────────
        const goalRows = await db.select().from(goals).where(eq(goals.userId, userId));
        const goalsData = goalRows.map(g => {
            const current = safeDecryptNumber(g.currentAmount);
            const target = safeDecryptNumber(g.targetAmount);
            const name = safeDecrypt(g.name);
            return {
                ...g,
                name,
                currentAmount: String(current),
                targetAmount: String(target),
                current,
                target,
                pct: target > 0 ? Math.round((current / target) * 100) : 0,
            };
        });

        // ── Recent transactions ─────────────────────────────────────────────
        const recentTx = monthTx
            .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
            .slice(0, 5);

        // ── Libre para Gastar (freeToSpend) ─────────────────────────────────
        // Step 1: recurring beneficiaries — those that appeared in last 3 months
        const prev3Months = new Set([prevMonth, month2, month3]);
        const prev3MonthExpenses = allTx.filter(t => prev3Months.has(t.month) && t.type === "despesa");

        // Group by beneficiary: compute avg, stddev, monthCount, category
        const benStats: Record<string, { amounts: number[]; months: Set<string>; category: string }> = {};
        for (const t of prev3MonthExpenses) {
            if (!benStats[t.beneficiary]) {
                benStats[t.beneficiary] = { amounts: [], months: new Set(), category: t.category };
            }
            benStats[t.beneficiary].amounts.push(t.amount);
            benStats[t.beneficiary].months.add(t.month);
            // Keep latest category
            benStats[t.beneficiary].category = t.category;
        }

        const recurringQuery: Array<{
            beneficiary: string;
            category: string;
            avgAmount: number;
            stddevAmount: number;
            monthCount: number;
        }> = [];

        for (const [ben, stat] of Object.entries(benStats)) {
            if (stat.months.size < 2) continue; // ≥2 of 3 months = recurring
            const avg = stat.amounts.reduce((s, v) => s + v, 0) / stat.amounts.length;
            const variance = stat.amounts.reduce((s, v) => s + (v - avg) ** 2, 0) / stat.amounts.length;
            const stddev = Math.sqrt(variance);
            recurringQuery.push({
                beneficiary: ben,
                category: stat.category,
                avgAmount: Math.round(avg * 100) / 100,
                stddevAmount: Math.round(stddev * 100) / 100,
                monthCount: stat.months.size,
            });
        }

        const recurringBeneficiaries = new Set(recurringQuery.map(r => r.beneficiary));
        const estimatedRecurring = recurringQuery.reduce((s, r) => s + r.avgAmount, 0);

        // ── Detect installment patterns ─────────────────────────────────────
        const installmentMap: Record<string, { current: number; total: number; monthsRemaining: number; paidCount: number; amount: number; category: string }> = {};
        const completedInstallments = new Set<string>();

        const selectedMonthNum = monthToNum(month);

        // All expenses sorted by beneficiary, date desc
        const allExpenses = allTx
            .filter(t => t.type === "despesa")
            .sort((a, b) => {
                if (a.beneficiary < b.beneficiary) return -1;
                if (a.beneficiary > b.beneficiary) return 1;
                return b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
            });

        for (const row of allExpenses) {
            if (row.beneficiary in installmentMap || completedInstallments.has(row.beneficiary)) continue;
            if (monthToNum(row.month) > selectedMonthNum) continue;

            if (!row.description) continue;
            const match = row.description.match(/\b(\d{1,2})\/(\d{1,2})\b/);
            if (match) {
                const paidCurrent = parseInt(match[1]);
                const total = parseInt(match[2]);
                if (paidCurrent >= 1 && paidCurrent <= total && total >= 2 && total <= 36) {
                    const nextInstallment = paidCurrent + 1;
                    if (nextInstallment <= total) {
                        installmentMap[row.beneficiary] = {
                            current: nextInstallment,
                            total,
                            monthsRemaining: total - nextInstallment,
                            paidCount: paidCurrent,
                            amount: Math.abs(row.amount),
                            category: row.category ?? "Outros",
                        };
                    } else {
                        completedInstallments.add(row.beneficiary);
                    }
                }
            }
        }

        // Shape recurring items
        const recurringItemsList: Array<{ beneficiary: string; category: string; avgAmount: number; monthCount: number; installment: { current: number; total: number; monthsRemaining: number; paidCount: number } | null }> = [];

        for (const r of recurringQuery) {
            if (completedInstallments.has(r.beneficiary)) continue;

            const avg = r.avgAmount;
            const stddev = r.stddevAmount;
            const inst = installmentMap[r.beneficiary];

            if (inst) {
                recurringItemsList.push({
                    beneficiary: r.beneficiary,
                    category: r.category ?? "Outros",
                    avgAmount: avg,
                    monthCount: r.monthCount,
                    installment: { current: inst.current, total: inst.total, monthsRemaining: inst.monthsRemaining, paidCount: inst.paidCount },
                });
            } else {
                const cv = avg > 0 ? stddev / avg : 0;
                if (cv < 0.15) {
                    recurringItemsList.push({
                        beneficiary: r.beneficiary,
                        category: r.category ?? "Outros",
                        avgAmount: avg,
                        monthCount: r.monthCount,
                        installment: null,
                    });
                }
            }
        }

        // Add non-recurring beneficiaries that have active installment patterns
        const recurringBenSet = new Set(recurringQuery.map(r => r.beneficiary));
        for (const [ben, inst] of Object.entries(installmentMap)) {
            if (!recurringBenSet.has(ben)) {
                recurringItemsList.push({
                    beneficiary: ben,
                    category: inst.category,
                    avgAmount: inst.amount,
                    monthCount: 1,
                    installment: { current: inst.current, total: inst.total, monthsRemaining: inst.monthsRemaining, paidCount: inst.paidCount },
                });
            }
        }

        recurringItemsList.sort((a, b) => b.avgAmount - a.avgAmount);
        const recurringItems = recurringItemsList.slice(0, 15);

        // Step 2: goal monthly contributions
        const now = new Date();
        const goalContributions = goalsData
            .filter(g => g.status === "active" && g.deadline)
            .reduce((sum, g) => {
                const deadline = new Date(g.deadline!);
                const monthsLeft = Math.max(1,
                    (deadline.getFullYear() - now.getFullYear()) * 12 +
                    (deadline.getMonth() - now.getMonth())
                );
                const needed = Math.max(0, g.target - g.current) / monthsLeft;
                return sum + needed;
            }, 0);

        // Step 3: variable spending in current month (non-recurring beneficiaries)
        const currentMonthExpBenSum = groupSum(monthExpenses, t => t.beneficiary);
        const variableSpent = Object.entries(currentMonthExpBenSum)
            .filter(([ben]) => !recurringBeneficiaries.has(ben))
            .reduce((s, [, total]) => s + total, 0);

        const freeToSpend = Math.round((receitas - estimatedRecurring - goalContributions - variableSpent) * 100) / 100;

        // ── Committed Income Breakdown ───────────────────────────────────────
        const committedTotal = estimatedRecurring + goalContributions;
        const committedPct = receitas > 0 ? Math.round((committedTotal / receitas) * 100) : 0;
        const variablePct = receitas > 0 ? Math.round((variableSpent / receitas) * 100) : 0;
        const freePct = Math.max(0, 100 - committedPct - variablePct);
        const committedBreakdown = {
            committedAmount: Math.round(committedTotal * 100) / 100,
            committedPct,
            variableAmount: Math.round(variableSpent * 100) / 100,
            variablePct,
            freeAmount: Math.round(freeToSpend * 100) / 100,
            freePct,
            commitmentLevel: committedPct > 80 ? "critical" as const
                : committedPct > 60 ? "high" as const
                : committedPct > 40 ? "moderate" as const
                : "healthy" as const,
        };

        // ── Burn Rate ───────────────────────────────────────────────────────
        const { year: mYear, monthIdx: mMonthIdx } = parseMonth(month);
        const totalDays = daysInMonth(mYear, mMonthIdx);
        let daysElapsed: number;

        if (month === currentMonth) {
            daysElapsed = Math.max(1, new Date().getDate());
        } else {
            daysElapsed = totalDays;
        }

        const dailyRate = Math.round((despesas / daysElapsed) * 100) / 100;
        const projectedMonthTotal = Math.round(dailyRate * totalDays * 100) / 100;
        let projectedRunOutDay: number | null = null;
        if (receitas > 0 && dailyRate > 0) {
            const day = Math.floor(receitas / dailyRate);
            projectedRunOutDay = day <= totalDays ? day : null;
        }

        // ── AI Summary ──────────────────────────────────────────────────────
        let aiSummaryContent: string | null = null;
        try {
            const [summaryRow] = await db
                .select({ content: aiSummaries.content })
                .from(aiSummaries)
                .where(eq(aiSummaries.userId, userId))
                .orderBy(desc(aiSummaries.generatedAt))
                .limit(1);
            aiSummaryContent = summaryRow ? safeDecrypt(summaryRow.content) : null;
        } catch {
            // Not critical — dashboard works without it
        }

        // ── Insights ────────────────────────────────────────────────────────

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
            const currentTotal = topCat.total;

            // Previous 3 months: expenses in the same category, grouped by month
            const prevCatExpenses = allTx.filter(t =>
                prev3Months.has(t.month) &&
                t.category === topCat.category &&
                t.type === "despesa"
            );
            const prevCatByMonth = groupSum(prevCatExpenses, t => t.month);
            const prevCatMonths = Object.values(prevCatByMonth);

            if (prevCatMonths.length > 0) {
                const avg = prevCatMonths.reduce((s, v) => s + v, 0) / prevCatMonths.length;
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
                        description: `Você gastou ${Math.abs(pctDiff)}% a menos em ${topCat.category} vs. média histórica.`,
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
        const benSumMap = groupSum(monthExpenses, t => t.beneficiary);
        // Find top beneficiary
        let topBen: { beneficiary: string; category: string; total: number } | null = null;
        let maxBenTotal = 0;
        for (const [ben, total] of Object.entries(benSumMap)) {
            if (total > maxBenTotal) {
                maxBenTotal = total;
                // Find the category for this beneficiary (use the most common one)
                const benTx = monthExpenses.filter(t => t.beneficiary === ben);
                const catCounts: Record<string, number> = {};
                for (const t of benTx) catCounts[t.category] = (catCounts[t.category] ?? 0) + 1;
                const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Outros";
                topBen = { beneficiary: ben, category: topCategory, total };
            }
        }

        let insight3 = {
            icon: "📥",
            title: "Importe sua fatura",
            description: "Nenhuma transação registrada ainda. Importe o CSV do Nubank para começar.",
            linkText: "Importar agora",
            linkHref: "/importar",
        };

        if (topBen?.beneficiary) {
            const catTotal = categoryBreakdown.find(c => c.category === topBen!.category)?.total ?? 1;
            const pct = catTotal > 0 ? Math.round((topBen.total / catTotal) * 100) : 0;
            insight3 = {
                icon: "📊",
                title: "Maior gasto isolado",
                description: `${topBen.beneficiary} respondeu por ${pct}% dos gastos em ${topBen.category} (R$ ${formatBRL(topBen.total)}).`,
                linkText: "Ver transações",
                linkHref: "/transacoes",
            };
        }

        // ── Nearest active goal for KPI card ────────────────────────────────
        const nearestActiveGoal = goalsData
            .filter(g => g.status === "active")
            .sort((a, b) => b.pct - a.pct)[0] ?? null;

        return NextResponse.json({
            summary: { receitas, despesas, saldo, txCount },
            prevSummary: { receitas: prevReceitas, despesas: prevDespesas, saldo: prevSaldo },
            categoryBreakdown: categoryBreakdown.map(c => ({ ...c, total: Number(c.total) })),
            trend,
            budgets: budgetStatus,
            goals: goalsData,
            recentTransactions: recentTx,
            insights: [insight1, insight2, insight3],
            freeToSpend: { freeToSpend, estimatedRecurring: Math.round(estimatedRecurring * 100) / 100, goalContributions: Math.round(goalContributions * 100) / 100, variableSpent: Math.round(variableSpent * 100) / 100 },
            burnRate: { dailyRate, projectedMonthTotal, daysElapsed, daysInMonth: totalDays, projectedRunOutDay },
            aiSummary: aiSummaryContent,
            nearestGoal: nearestActiveGoal,
            recurringItems,
            committedBreakdown,
        });
    } catch (err) {
        console.error("Dashboard summary error:", err);
        return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
    }
}

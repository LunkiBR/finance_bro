"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BudgetMini } from "@/components/dashboard/budget-mini";
import { GoalMini } from "@/components/dashboard/goal-mini";
import { InsightCard } from "@/components/dashboard/insight-card";
import { MonthSelector } from "@/components/transactions/month-selector";
import { InlineChart } from "@/components/charts/inline-chart";
import { getCategoryColor } from "@/lib/category-colors";
import { getCurrentMonth, calcDelta, formatBRL } from "@/lib/utils";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Percent } from "lucide-react";

interface Insight {
    icon: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
}

interface DashboardData {
    summary: { receitas: number; despesas: number; saldo: number; txCount: number };
    prevSummary: { receitas: number; despesas: number; saldo: number };
    categoryBreakdown: Array<{ category: string; total: number; count: number }>;
    trend: Array<{ month: string; receitas: number; despesas: number }>;
    budgets: Array<{ category: string; spent: number; limit: number; pct: number }>;
    goals: Array<{ id: string; name: string; current: number; target: number; pct: number; deadline: string | null; status: string }>;
    recentTransactions: Array<{ id: string; date: string; description: string; category: string; type: string; amount: string }>;
    insights: [Insight, Insight, Insight];
}

export default function DashboardPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/dashboard/summary?month=${month}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [month]);

    const taxaPoupanca = data && data.summary.receitas > 0
        ? Math.round(((data.summary.receitas - data.summary.despesas) / data.summary.receitas) * 100)
        : 0;

    const prevTaxaPoupanca = data && data.prevSummary.receitas > 0
        ? Math.round(((data.prevSummary.receitas - data.prevSummary.despesas) / data.prevSummary.receitas) * 100)
        : 0;

    const saldoDelta = data ? calcDelta(data.summary.saldo, data.prevSummary.saldo) : undefined;
    const receitasDelta = data ? calcDelta(data.summary.receitas, data.prevSummary.receitas) : undefined;
    const despesasDelta = data ? calcDelta(data.summary.despesas, data.prevSummary.despesas) : undefined;
    const taxaDelta = data ? calcDelta(taxaPoupanca, prevTaxaPoupanca) : undefined;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
                    <p className="text-body mt-1" style={{ color: "var(--text-secondary)" }}>
                        Visão geral das suas finanças
                    </p>
                </div>
                <MonthSelector month={month} onChange={setMonth} />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : data ? (
                <>
                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <KpiCard
                            title="Saldo do Mês"
                            value={`R$ ${formatBRL(data.summary.saldo)}`}
                            delta={saldoDelta}
                            deltaLabel="vs mês anterior"
                            icon={<Wallet size={16} />}
                        />
                        <KpiCard
                            title="Total Recebido"
                            value={`R$ ${formatBRL(data.summary.receitas)}`}
                            delta={receitasDelta}
                            deltaLabel="vs mês anterior"
                            icon={<TrendingUp size={16} />}
                        />
                        <KpiCard
                            title="Total Gasto"
                            value={`R$ ${formatBRL(data.summary.despesas)}`}
                            delta={despesasDelta}
                            deltaLabel="vs mês anterior"
                            icon={<TrendingDown size={16} />}
                            positiveIsGood={false}
                        />
                        <KpiCard
                            title="Taxa de Poupança"
                            value={`${taxaPoupanca}%`}
                            delta={taxaDelta}
                            deltaLabel="vs mês anterior"
                            icon={<Percent size={16} />}
                        />
                    </div>

                    {/* Row 2: Charts */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="col-span-2">
                            <InlineChart
                                spec={{
                                    type: "area",
                                    title: "Evolução — Últimos 6 meses",
                                    data: data.trend.map((t) => ({ name: t.month, receitas: t.receitas, despesas: t.despesas, value: t.receitas })),
                                    xKey: "name",
                                    yKey: "value",
                                    series: [
                                        { key: "receitas", color: "#00A67E", label: "Receitas" },
                                        { key: "despesas", color: "#E5484D", label: "Despesas" },
                                    ],
                                }}
                            />
                        </div>
                        <div>
                            <InlineChart
                                spec={{
                                    type: "pie",
                                    title: "Gastos por Categoria",
                                    data: data.categoryBreakdown.slice(0, 5).map((c) => ({
                                        name: c.category,
                                        value: c.total,
                                    })),
                                    xKey: "name",
                                    yKey: "value",
                                }}
                            />
                        </div>
                    </div>

                    {/* Row 3: Budgets + Goals */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
                            <h3 className="text-h3 mb-4" style={{ color: "var(--text-primary)" }}>
                                Orçamentos do Mês
                            </h3>
                            {data.budgets.length > 0 ? (
                                data.budgets.map((b) => (
                                    <BudgetMini key={b.category} category={b.category} spent={b.spent} limit={b.limit} />
                                ))
                            ) : (
                                <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                                    Nenhum orçamento definido para este mês.
                                </p>
                            )}
                        </div>
                        <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
                            <h3 className="text-h3 mb-4" style={{ color: "var(--text-primary)" }}>
                                Metas Ativas
                            </h3>
                            {data.goals.filter((g) => g.status === "active").length > 0 ? (
                                data.goals
                                    .filter((g) => g.status === "active")
                                    .map((g) => (
                                        <GoalMini key={g.id} name={g.name} current={g.current} target={g.target} deadline={g.deadline || undefined} />
                                    ))
                            ) : (
                                <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                                    Nenhuma meta ativa.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Row 4: Insights */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {data.insights.map((insight, i) => (
                            <InsightCard
                                key={i}
                                icon={insight.icon}
                                title={insight.title}
                                description={insight.description}
                                linkText={insight.linkText}
                                linkHref={insight.linkHref}
                            />
                        ))}
                    </div>

                    {/* Row 5: Recent Transactions */}
                    <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-h3" style={{ color: "var(--text-primary)" }}>
                                Transações Recentes
                            </h3>
                            <Link
                                href="/transacoes"
                                className="text-caption transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Ver todas →
                            </Link>
                        </div>
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Data</th>
                                    <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Descrição</th>
                                    <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Categoria</th>
                                    <th className="text-right py-2 font-medium" style={{ color: "var(--text-muted)" }}>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentTransactions.map((tx) => {
                                    const isIncome = tx.type === "receita";
                                    const catColor = getCategoryColor(tx.category);
                                    return (
                                        <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                                                {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                            </td>
                                            <td className="py-2" style={{ color: "var(--text-primary)" }}>
                                                {tx.description.length > 30 ? tx.description.slice(0, 30) + "..." : tx.description}
                                            </td>
                                            <td className="py-2">
                                                <span
                                                    className="inline-flex px-2 py-[2px] rounded-[4px] text-[11px]"
                                                    style={{ background: catColor.bg, color: catColor.text }}
                                                >
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right" style={{ color: isIncome ? "var(--accent-green)" : "var(--accent-red)" }}>
                                                {isIncome ? "+" : "-"}R$ {formatBRL(Math.abs(Number(tx.amount)))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </div>
    );
}

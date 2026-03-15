"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BudgetMini } from "@/components/dashboard/budget-mini";
import { RadarCard } from "@/components/dashboard/radar-card";
import { MonthSelector } from "@/components/transactions/month-selector";
import { InlineChart } from "@/components/charts/inline-chart";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { CommittedBreakdown } from "@/components/dashboard/committed-breakdown";
import Link from "next/link";
import { Sparkles, Scale, ArrowDownCircle, ArrowUpCircle, Target, Percent } from "lucide-react";

interface Insight {
    icon: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
}

interface GoalData {
    id: string;
    name: string;
    current: number;
    target: number;
    pct: number;
    deadline: string | null;
    status: string;
}

interface DashboardData {
    summary: { receitas: number; despesas: number; saldo: number; txCount: number };
    prevSummary: { receitas: number; despesas: number; saldo: number };
    categoryBreakdown: Array<{ category: string; total: number; count: number }>;
    trend: Array<{ month: string; receitas: number; despesas: number }>;
    budgets: Array<{ category: string; spent: number; limit: number; pct: number }>;
    goals: Array<GoalData>;
    recentTransactions: Array<{ id: string; date: string; description: string; category: string; type: string; amount: string }>;
    insights: [Insight, Insight, Insight];
    freeToSpend: { freeToSpend: number; estimatedRecurring: number; goalContributions: number; variableSpent: number };
    burnRate: { dailyRate: number; projectedMonthTotal: number; daysElapsed: number; daysInMonth: number; projectedRunOutDay: number | null };
    aiSummary: string | null;
    nearestGoal: GoalData | null;
    recurringItems: Array<{ beneficiary: string; category: string; avgAmount: number; monthCount: number; installment: { current: number; total: number; monthsRemaining: number; paidCount?: number } | null }>;
    committedBreakdown: {
        committedAmount: number;
        committedPct: number;
        variableAmount: number;
        variablePct: number;
        freeAmount: number;
        freePct: number;
        commitmentLevel: "critical" | "high" | "moderate" | "healthy";
    } | null;
}

export default function DashboardPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        fetch(`/api/dashboard/summary?month=${month}`)
            .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, [month]);

    const taxaPoupanca = data && data.summary.receitas > 0
        ? Math.round(((data.summary.receitas - data.summary.despesas) / data.summary.receitas) * 100)
        : 0;

    const receitasPctDelta = data && data.prevSummary.receitas > 0
        ? Math.round(((data.summary.receitas - data.prevSummary.receitas) / data.prevSummary.receitas) * 100)
        : undefined;
    const despesasPctDelta = data && data.prevSummary.despesas > 0
        ? Math.round(((data.summary.despesas - data.prevSummary.despesas) / data.prevSummary.despesas) * 100)
        : undefined;
    const saldoDelta = data ? Math.round((data.summary.saldo - data.prevSummary.saldo) * 100) / 100 : undefined;

    const burnRate = data?.burnRate;
    const areaWarning = data ? data.summary.despesas > data.summary.receitas : false;
    const isNegativeSaldo = data ? data.summary.saldo < 0 : false;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
                    <p className="text-body mt-1" style={{ color: "var(--text-secondary)" }}>
                        Visão geral das suas finanças
                    </p>
                </div>
                <MonthSelector month={month} onChange={setMonth} />
            </div>

            {loading ? (
                <div className="space-y-6">
                    {/* Shimmer KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-[6px] border p-4 h-[90px] animate-shimmer" style={{ borderColor: "var(--border)" }} />
                        ))}
                    </div>
                    {/* Shimmer insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="rounded-[6px] border p-4 h-[80px] animate-shimmer" style={{ borderColor: "var(--border)" }} />
                        ))}
                    </div>
                    {/* Shimmer chart */}
                    <div className="rounded-[6px] border h-[200px] animate-shimmer" style={{ borderColor: "var(--border)" }} />
                </div>
            ) : error || !data ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                    <p className="text-h3" style={{ color: "var(--text-primary)" }}>
                        {error ? "Erro ao carregar dados" : "Nenhum dado disponível"}
                    </p>
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                        {error ? "Não foi possível se conectar ao servidor. Tente novamente." : "Importe transações para começar."}
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Seção 1: AI Summary Banner ──────────────────────────────── */}
                    {data.aiSummary && (
                        <div
                            className="animate-fade-up stagger-1 flex items-start gap-3 px-5 py-4 mb-6 rounded-[8px]"
                            style={{
                                background: "rgba(17,18,21,0.8)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid var(--border)",
                                borderLeft: "3px solid var(--accent-purple)",
                            }}
                        >
                            <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: "var(--accent-purple)" }} />
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.7 }}>
                                {data.aiSummary}
                            </p>
                        </div>
                    )}

                    {/* ── Seção 2: KPI Cards ──────────────────────────────────────── */}
                    <div className="animate-fade-up stagger-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Card 1: Saldo do Mês */}
                        <KpiCard
                            title="Saldo do Mês"
                            value={
                                isNegativeSaldo
                                    ? `-R$ ${formatBRL(Math.abs(data.summary.saldo))}`
                                    : `R$ ${formatBRL(data.summary.saldo)}`
                            }
                            subtitle={`${data.summary.txCount} transações no mês`}
                            delta={saldoDelta}
                            deltaFormat="currency"
                            deltaLabel="vs mês anterior"
                            positiveIsGood={true}
                            icon={<Scale size={16} />}
                            warning={isNegativeSaldo}
                        />

                        {/* Card 2: Receitas do Mês — A Âncora Positiva */}
                        <KpiCard
                            title="Receitas do Mês"
                            value={`R$ ${formatBRL(data.summary.receitas)}`}
                            delta={receitasPctDelta}
                            deltaFormat="pct"
                            deltaLabel="vs mês anterior"
                            positiveIsGood={true}
                            icon={<ArrowDownCircle size={16} />}
                        />

                        {/* Card 3: Despesas do Mês — A Âncora Negativa + Predição */}
                        <KpiCard
                            title="Despesas do Mês"
                            value={`R$ ${formatBRL(data.summary.despesas)}`}
                            subtitle={
                                burnRate?.projectedRunOutDay
                                    ? `Neste ritmo, você estoura dia ${burnRate.projectedRunOutDay}`
                                    : `R$ ${formatBRL(burnRate?.dailyRate ?? 0)}/dia · ${burnRate?.daysElapsed ?? 0} dias`
                            }
                            delta={despesasPctDelta}
                            deltaFormat="pct"
                            deltaLabel="vs mês anterior"
                            positiveIsGood={false}
                            icon={<ArrowUpCircle size={16} />}
                            warning={burnRate?.projectedRunOutDay != null}
                        />

                        {/* Card 4: Objetivo — A Cenoura */}
                        {data.nearestGoal ? (
                            <KpiCard
                                title="Próxima Meta"
                                value={data.nearestGoal.name}
                                subtitle={`R$ ${formatBRL(data.nearestGoal.target - data.nearestGoal.current)} restantes`}
                                icon={<Target size={16} />}
                                barPct={data.nearestGoal.pct}
                                barColor="var(--accent-purple)"
                            />
                        ) : (
                            <KpiCard
                                title="Poupança Real"
                                value={`${taxaPoupanca}%`}
                                subtitle={
                                    data.summary.saldo > 0
                                        ? `R$ ${formatBRL(data.summary.saldo)} disponível`
                                        : `Déficit de R$ ${formatBRL(Math.abs(data.summary.saldo))}`
                                }
                                icon={<Percent size={16} />}
                                warning={taxaPoupanca < 0}
                            />
                        )}
                    </div>

                    {/* ── Seção 2.5: Renda Comprometida ───────────────────────────── */}
                    {data.committedBreakdown && (
                        <div className="animate-fade-up stagger-3 mb-6">
                            <CommittedBreakdown
                                breakdown={data.committedBreakdown}
                                recurringItems={data.recurringItems ?? []}
                                receitas={data.summary.receitas}
                            />
                        </div>
                    )}

                    {/* ── Seção 3: Destaques do Mês ───────────────────────────────── */}
                    <div className="animate-fade-up stagger-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {(data.insights ?? []).map((insight, i) => (
                            <RadarCard
                                key={i}
                                icon={insight.icon}
                                title={insight.title}
                                description={insight.description}
                                linkHref={insight.linkHref}
                            />
                        ))}
                    </div>

                    {/* ── Seção 4: Charts ─────────────────────────────────────────── */}
                    <div className="animate-fade-up stagger-4 grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                        <div className="lg:col-span-3">
                            <InlineChart
                                areaWarning={areaWarning}
                                spec={{
                                    type: "area",
                                    title: "Evolução — Últimos 6 meses",
                                    data: (data.trend ?? []).map((t) => ({
                                        name: t.month,
                                        receitas: t.receitas,
                                        despesas: t.despesas,
                                        value: t.receitas,
                                    })),
                                    xKey: "name",
                                    yKey: "value",
                                    series: [
                                        { key: "receitas", color: "#00A67E", label: "Receitas" },
                                        { key: "despesas", color: "#E5484D", label: "Despesas" },
                                    ],
                                }}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <InlineChart
                                monoDonut={true}
                                spec={{
                                    type: "pie",
                                    title: "Gastos por Categoria",
                                    data: (data.categoryBreakdown ?? []).slice(0, 6).map((c) => ({
                                        name: c.category,
                                        value: c.total,
                                    })),
                                    xKey: "name",
                                    yKey: "value",
                                }}
                            />
                        </div>
                    </div>

                    {/* ── Seção 5: Orçamentos (thin bars) ────────────────────────── */}
                    <div className="animate-fade-up stagger-5 rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-h3" style={{ color: "var(--text-primary)" }}>Orçamentos do Mês</h3>
                            <Link
                                href="/orcamentos"
                                className="text-caption transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Gerenciar →
                            </Link>
                        </div>
                        {(data.budgets ?? []).length > 0 ? (
                            <div className="space-y-0.5">
                                {(data.budgets ?? []).map((b) => (
                                    <BudgetMini key={b.category} category={b.category} spent={b.spent} limit={b.limit} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between py-2">
                                <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                                    Nenhum orçamento definido para este mês.
                                </p>
                                <Link
                                    href="/orcamentos"
                                    className="text-caption transition-opacity hover:opacity-80"
                                    style={{ color: "var(--accent-blue)" }}
                                >
                                    Criar →
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

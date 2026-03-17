"use client";

import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { Cpu, DollarSign, Zap, Users, TrendingUp, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const PT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function toApiPeriod(m: string): string {
  const [mon, y] = m.split("/");
  const idx = PT_MONTHS.indexOf(mon) + 1;
  return `20${y}-${String(idx).padStart(2, "0")}`;
}

interface PerUser {
  userId: string;
  userName: string | null;
  username: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: string;
  costBrl: string;
  callCount: number;
  avgTokensPerCall: number;
  sources: Record<string, { tokens: number; calls: number }>;
}

interface DailyPoint {
  day: string;
  tokens: number;
  costUsd: number;
  costBrl: number;
  calls: number;
}

interface TokenData {
  period: string;
  usdToBrl: number;
  isCurrentMonth: boolean;
  grandTotal: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: string;
    costBrl: string;
    callCount: number;
    activeUsers: number;
  };
  saasMetrics: {
    avgCostPerUserUsd: string;
    avgCostPerUserBrl: string;
    avgCostPerCallUsd: string;
    avgCostPerCallBrl: string;
    avgTokensPerCall: number;
    projectedCostUsd: string;
    projectedCostBrl: string;
  };
  perUser: PerUser[];
  dailyBreakdown: DailyPoint[];
  recentCalls: {
    id: string;
    userId: string;
    userName: string | null;
    source: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: string;
    costBrl: string;
    createdAt: string;
  }[];
}

const SOURCE_LABEL: Record<string, string> = {
  chat: "Chat",
  identify_payee: "Payee ID",
  n8n_categorize: "Categorização",
};

const SOURCE_COLOR: Record<string, string> = {
  chat: "bg-blue-500",
  identify_payee: "bg-purple-500",
  n8n_categorize: "bg-amber-500",
};

export default function TokenUsagePage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/token-usage?period=${toApiPeriod(month)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Acesso negado" : "Erro ao carregar dados");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month]);

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const maxUserCost = data
    ? Math.max(...data.perUser.map((u) => parseFloat(u.costBrl)), 0.0001)
    : 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uso de Tokens</h1>
          <p className="text-muted-foreground text-sm">
            Custo de AI por usuário · Gemini 2.5 Flash
          </p>
        </div>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="text-muted-foreground py-20 text-center">Carregando...</div>
      ) : data ? (
        <>
          {/* ── KPI row 1: totals ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Custo Total"
              value={`R$ ${data.grandTotal.costBrl}`}
              sub={`$ ${parseFloat(data.grandTotal.costUsd).toFixed(4)}`}
            />
            <KpiCard
              icon={<Cpu className="h-4 w-4" />}
              label="Total Tokens"
              value={fmtNum(data.grandTotal.totalTokens)}
              sub={`${fmtNum(data.grandTotal.inputTokens)} in / ${fmtNum(data.grandTotal.outputTokens)} out`}
            />
            <KpiCard
              icon={<Zap className="h-4 w-4" />}
              label="Chamadas AI"
              value={fmtNum(data.grandTotal.callCount)}
            />
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Usuários Ativos"
              value={data.grandTotal.activeUsers.toString()}
            />
            <KpiCard
              icon={<BarChart2 className="h-4 w-4" />}
              label="Custo Médio/Usuário"
              value={`R$ ${data.saasMetrics.avgCostPerUserBrl}`}
              sub={`$ ${parseFloat(data.saasMetrics.avgCostPerUserUsd).toFixed(4)}`}
              highlight
            />
            {data.isCurrentMonth && (
              <KpiCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Projeção do Mês"
                value={`R$ ${data.saasMetrics.projectedCostBrl}`}
                sub={`$ ${data.saasMetrics.projectedCostUsd}`}
                highlight
              />
            )}
          </div>

          {/* ── KPI row 2: per-call metrics ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricBox
              label="Custo médio por chamada"
              value={`R$ ${data.saasMetrics.avgCostPerCallBrl}`}
              sub={`$ ${parseFloat(data.saasMetrics.avgCostPerCallUsd).toFixed(6)}`}
            />
            <MetricBox
              label="Tokens médios por chamada"
              value={fmtNum(data.saasMetrics.avgTokensPerCall)}
            />
            <MetricBox
              label="Câmbio usado"
              value={`1 USD = R$ ${data.usdToBrl}`}
              sub="Fixo · Gemini 2.5 Flash"
            />
          </div>

          {/* ── Daily cost chart ── */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 font-semibold">Custo diário (BRL)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dailyBreakdown} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d) => {
                    const day = parseInt(d.split("-")[2]);
                    return day % 5 === 1 || day === 1 ? String(day) : "";
                  }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v.toFixed(2)}`}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(v: number) => [`R$ ${v.toFixed(4)}`, "Custo"]}
                  labelFormatter={(l) => {
                    const [, , d] = l.split("-");
                    return `Dia ${parseInt(d)}`;
                  }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="costBrl" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Per-user table with visual bars ── */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Custo por Usuário</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Ordenado por custo decrescente</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2">Usuário</th>
                    <th className="px-4 py-2">Proporção</th>
                    <th className="px-4 py-2 text-right">Tokens</th>
                    <th className="px-4 py-2 text-right">Chamadas</th>
                    <th className="px-4 py-2 text-right">Tok/chamada</th>
                    <th className="px-4 py-2 text-right">Custo (USD)</th>
                    <th className="px-4 py-2 text-right">Custo (BRL)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perUser.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum uso registrado neste período.
                      </td>
                    </tr>
                  ) : (
                    data.perUser.map((u) => {
                      const pct = (parseFloat(u.costBrl) / maxUserCost) * 100;
                      const chatTokens = u.sources["chat"]?.tokens ?? 0;
                      const payeeTokens = u.sources["identify_payee"]?.tokens ?? 0;
                      const chatPct = u.totalTokens > 0 ? (chatTokens / u.totalTokens) * 100 : 0;
                      const payeePct = u.totalTokens > 0 ? (payeeTokens / u.totalTokens) * 100 : 0;
                      return (
                        <tr key={u.userId} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {u.userName || u.username}
                            {/* Source pills */}
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {Object.entries(u.sources).map(([src, v]) => (
                                <span
                                  key={src}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${SOURCE_COLOR[src] ?? "bg-gray-400"}`} />
                                  {SOURCE_LABEL[src] ?? src}: {v.calls}x
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 min-w-[120px]">
                            {/* Cost bar */}
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-1">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {/* Token source breakdown */}
                            {u.totalTokens > 0 && (
                              <div className="flex h-1 w-full overflow-hidden rounded-full">
                                <div className="bg-blue-500" style={{ width: `${chatPct}%` }} />
                                <div className="bg-purple-500" style={{ width: `${payeePct}%` }} />
                                <div className="bg-muted flex-1" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {fmtNum(u.totalTokens)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{u.callCount}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {fmtNum(u.avgTokensPerCall)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            ${parseFloat(u.costUsd).toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {formatBRL(parseFloat(u.costBrl))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent calls ── */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Chamadas Recentes</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Últimas 30 do período</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2">Usuário</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2 text-right">In</th>
                    <th className="px-4 py-2 text-right">Out</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right">Custo (BRL)</th>
                    <th className="px-4 py-2 text-right">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentCalls.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{c.userName || "—"}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.source === "chat"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : c.source === "identify_payee"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {SOURCE_LABEL[c.source] ?? c.source}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {fmtNum(c.inputTokens)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {fmtNum(c.outputTokens)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtNum(c.totalTokens)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">R$ {c.costBrl}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR");
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary/5" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </div>
  );
}

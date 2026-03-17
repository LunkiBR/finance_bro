"use client";

import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { getCurrentMonth } from "@/lib/utils";
import { DollarSign, Zap, Users, TrendingUp, BarChart2, Cpu } from "lucide-react";
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
}

const SOURCE_LABEL: Record<string, string> = {
  chat: "Copiloto",
  identify_payee: "Payee ID",
  n8n_categorize: "Categorização",
};

const SOURCE_COLOR: Record<string, string> = {
  chat: "#7C3AED",
  identify_payee: "#8B5CF6",
  n8n_categorize: "#F59E0B",
};

const SOURCE_MODEL: Record<string, string> = {
  chat: "Gemini 2.5 Flash",
  identify_payee: "Gemini 2.5 Flash",
  n8n_categorize: "GPT-4o mini",
};

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR");
}

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

  if (error) return <div className="p-6" style={{ color: "var(--accent-red)" }}>{error}</div>;

  const maxUserCost = data ? Math.max(...data.perUser.map((u) => parseFloat(u.costBrl)), 0.0001) : 1;

  // Compute total spend from daily data (for the chart label)
  const totalSpend = data ? parseFloat(data.grandTotal.costBrl) : 0;

  return (
    <div
      className="space-y-6 p-4 sm:p-6 max-w-[900px]"
      style={{ color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2">Uso de Tokens</h1>
          <p className="text-caption mt-0.5" style={{ color: "var(--text-muted)" }}>
            Custo de IA por usuário · Gemini 2.5 Flash + GPT-4o mini
          </p>
        </div>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      {loading ? (
        /* ── Skeleton ── */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-[10px] border p-4 h-20 animate-pulse"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              />
            ))}
          </div>
          <div
            className="rounded-[10px] border p-4 h-52 animate-pulse"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          />
        </div>
      ) : data ? (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              icon={<DollarSign size={15} />}
              label="Custo Total"
              value={`R$ ${data.grandTotal.costBrl}`}
              sub={`$ ${parseFloat(data.grandTotal.costUsd).toFixed(4)}`}
              accent
            />
            {data.isCurrentMonth && (
              <KpiCard
                icon={<TrendingUp size={15} />}
                label="Projeção do Mês"
                value={`R$ ${data.saasMetrics.projectedCostBrl}`}
                sub={`$ ${data.saasMetrics.projectedCostUsd}`}
              />
            )}
            <KpiCard
              icon={<Zap size={15} />}
              label="Chamadas AI"
              value={fmtNum(data.grandTotal.callCount)}
              sub={`Ø ${fmtNum(data.saasMetrics.avgTokensPerCall)} tok/chamada`}
            />
            <KpiCard
              icon={<Users size={15} />}
              label="Usuários Ativos"
              value={data.grandTotal.activeUsers.toString()}
              sub={`R$ ${data.saasMetrics.avgCostPerUserBrl} /usuário`}
            />
            <KpiCard
              icon={<Cpu size={15} />}
              label="Total Tokens"
              value={fmtNum(data.grandTotal.totalTokens)}
              sub={`${fmtNum(data.grandTotal.inputTokens)} in / ${fmtNum(data.grandTotal.outputTokens)} out`}
            />
          </div>

          {/* ── Daily cost chart (OpenAI-style) ── */}
          <div
            className="rounded-[10px] border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Total Spend</p>
            </div>
            <p className="text-[24px] font-semibold mb-4">
              R$ {totalSpend.toFixed(2)}
              <span className="text-[13px] font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                ${parseFloat(data.grandTotal.costUsd).toFixed(4)} USD
              </span>
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dailyBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d) => {
                    const day = parseInt(d.split("-")[2]);
                    return day % 5 === 1 || day === 1 ? String(day) : "";
                  }}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v.toFixed(2)}`}
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(v: number | undefined) => [`R$ ${(v ?? 0).toFixed(4)}`, "Custo"]}
                  labelFormatter={(l) => {
                    const [, , d] = l.split("-");
                    return `Dia ${parseInt(d)}`;
                  }}
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="costBrl" fill="#7C3AED" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Source legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {Object.entries(SOURCE_LABEL).map(([src, label]) => (
                <div key={src} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-sm"
                    style={{ background: SOURCE_COLOR[src] }}
                  />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {label}
                    <span className="ml-1 opacity-60">({SOURCE_MODEL[src]})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per-user breakdown ── */}
          <div
            className="rounded-[10px] border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
            >
              <h2 className="text-[14px] font-medium">Custo por usuário</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Ordenado por custo decrescente
              </p>
            </div>
            {data.perUser.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                Nenhum uso registrado neste período.
              </div>
            ) : (
              <div className="divide-y" style={{ background: "var(--bg-surface)" }}>
                {data.perUser.map((u) => {
                  const pct = (parseFloat(u.costBrl) / maxUserCost) * 100;
                  const chatCalls = u.sources["chat"]?.calls ?? 0;
                  const categCalls = u.sources["n8n_categorize"]?.calls ?? 0;
                  return (
                    <div
                      key={u.userId}
                      className="px-5 py-4"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* Name row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0"
                            style={{
                              background: "rgba(124,58,237,0.15)",
                              color: "#7C3AED",
                              border: "1px solid rgba(124,58,237,0.2)",
                            }}
                          >
                            {(u.userName || u.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium">{u.userName || u.username}</p>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {u.callCount} chamadas · {fmtNum(u.totalTokens)} tokens
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-semibold">
                            R$ {parseFloat(u.costBrl).toFixed(2)}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            ${parseFloat(u.costUsd).toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {/* Cost bar */}
                      <div
                        className="h-1.5 rounded-full overflow-hidden mb-2"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(to right, #7C3AED, #8B5CF6)",
                          }}
                        />
                      </div>

                      {/* Source pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(u.sources).map(([src, v]) => (
                          <span
                            key={src}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                            style={{
                              background: `${SOURCE_COLOR[src]}15`,
                              color: SOURCE_COLOR[src],
                              border: `1px solid ${SOURCE_COLOR[src]}30`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: SOURCE_COLOR[src] }}
                            />
                            {SOURCE_LABEL[src] ?? src}: {v.calls}x
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Stats row (câmbio, custo/chamada) ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBox label="Custo médio/chamada" value={`R$ ${data.saasMetrics.avgCostPerCallBrl}`} sub={`$ ${parseFloat(data.saasMetrics.avgCostPerCallUsd).toFixed(6)}`} />
            <StatBox label="Tokens médios/chamada" value={fmtNum(data.saasMetrics.avgTokensPerCall)} />
            <StatBox label="Câmbio" value={`1 USD = R$ ${data.usdToBrl}`} sub="Fixo" />
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-[10px] border p-4"
      style={{
        background: accent ? "rgba(124,58,237,0.08)" : "var(--bg-surface)",
        borderColor: accent ? "rgba(124,58,237,0.25)" : "var(--border)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-2" style={{ color: accent ? "#7C3AED" : "var(--text-muted)" }}>
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[18px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-[10px] border px-4 py-3"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <p className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-[15px] font-semibold">{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

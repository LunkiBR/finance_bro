"use client";

import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { Cpu, DollarSign, Zap, Users } from "lucide-react";

const PT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "mar/26" → "2026-03" */
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
}

interface RecentCall {
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
}

interface TokenData {
  period: string;
  usdToBrl: number;
  perUser: PerUser[];
  grandTotal: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: string;
    costBrl: string;
    callCount: number;
  };
  recentCalls: RecentCall[];
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

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uso de Tokens</h1>
          <p className="text-muted-foreground text-sm">
            Custo de AI por usuário (Gemini 2.5 Flash)
          </p>
        </div>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center">Carregando...</div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Custo Total (BRL)"
              value={formatBRL(parseFloat(data.grandTotal.costBrl))}
            />
            <KpiCard
              icon={<Cpu className="h-5 w-5" />}
              label="Total Tokens"
              value={data.grandTotal.totalTokens.toLocaleString("pt-BR")}
            />
            <KpiCard
              icon={<Zap className="h-5 w-5" />}
              label="Chamadas AI"
              value={data.grandTotal.callCount.toLocaleString("pt-BR")}
            />
            <KpiCard
              icon={<Users className="h-5 w-5" />}
              label="Usuários Ativos"
              value={data.perUser.length.toString()}
            />
          </div>

          {/* Per-user table */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Custo por Usuário</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2">Usuário</th>
                    <th className="px-4 py-2 text-right">Input</th>
                    <th className="px-4 py-2 text-right">Output</th>
                    <th className="px-4 py-2 text-right">Total Tokens</th>
                    <th className="px-4 py-2 text-right">Chamadas</th>
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
                    data.perUser.map((u) => (
                      <tr key={u.userId} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">
                          {u.userName || u.username}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {u.inputTokens.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {u.outputTokens.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {u.totalTokens.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{u.callCount}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          ${parseFloat(u.costUsd).toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">
                          {formatBRL(parseFloat(u.costBrl))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent calls */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Chamadas Recentes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2">Usuário</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2 text-right">Tokens</th>
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
                              : c.source === "n8n_categorize"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}
                        >
                          {c.source === "chat" ? "Chat" : c.source === "n8n_categorize" ? "Categorização" : "Identify Payee"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {c.totalTokens.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        R$ {c.costBrl}
                      </td>
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

          {/* Exchange rate note */}
          <p className="text-muted-foreground text-xs">
            Câmbio fixo: 1 USD = {data.usdToBrl} BRL. Pricing: Gemini 2.5 Flash — $0.15/1M input, $0.60/1M output.
          </p>
        </>
      ) : null}
    </div>
  );
}

// ─── Simple KPI Card (inline, avoids import issues) ──────────────────────────

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

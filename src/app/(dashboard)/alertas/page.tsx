"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import Link from "next/link";

interface AlertData {
    id: string;
    type: "budget_80pct" | "budget_exceeded" | "goal_reminder";
    category: string;
    message: string;
    dismissedAt: string | null;
    createdAt: string;
}

const ALERT_ICONS: Record<string, { icon: string; color: string }> = {
    budget_80pct: { icon: "⚠", color: "var(--accent-amber)" },
    budget_exceeded: { icon: "⚠", color: "var(--accent-amber)" },
    goal_reminder: { icon: "🎯", color: "var(--accent-purple)" },
};

export default function AlertasPage() {
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/alerts")
            .then((r) => r.json())
            .then((d) => { setAlerts(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    async function dismissAlert(id: string) {
        await fetch("/api/alerts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setAlerts((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, dismissedAt: new Date().toISOString() } : a
            )
        );
    }

    const active = alerts.filter((a) => !a.dismissedAt);
    const dismissed = alerts.filter((a) => a.dismissedAt);

    function formatDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
            ", " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function getCategoryLink(type: string) {
        if (type.startsWith("budget")) return "/transacoes";
        return "/metas";
    }

    return (
        <div>
            <h1 className="text-h1 mb-6" style={{ color: "var(--text-primary)" }}>
                Alertas ativos <span className="text-caption ml-2" style={{ color: "var(--text-muted)" }}>({active.length})</span>
            </h1>

            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : active.length === 0 && dismissed.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-[400px]">
                    <div
                        className="w-[48px] h-[48px] rounded-full flex items-center justify-center mb-4"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                    >
                        <Check size={24} style={{ color: "var(--accent-green)" }} />
                    </div>
                    <h3 className="text-h3 mb-1" style={{ color: "var(--text-primary)" }}>
                        Nenhum alerta ativo.
                    </h3>
                    <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                        Suas finanças estão em ordem.
                    </p>
                </div>
            ) : (
                <>
                    {/* Active alerts */}
                    <div className="space-y-3 mb-8">
                        {active.map((a) => {
                            const alertStyle = ALERT_ICONS[a.type] || ALERT_ICONS.budget_exceeded;
                            return (
                                <div
                                    key={a.id}
                                    className="rounded-[6px] border p-4"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: alertStyle.color }}>{alertStyle.icon}</span>
                                            <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                                {a.type.startsWith("budget") ? "Orçamento" : "Meta"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                                                {formatDate(a.createdAt)}
                                            </span>
                                            <button
                                                onClick={() => dismissAlert(a.id)}
                                                className="transition-opacity hover:opacity-80"
                                                style={{ color: "var(--text-muted)" }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-body mb-2" style={{ color: "var(--text-secondary)" }}>
                                        {a.message}
                                    </p>
                                    <Link
                                        href={getCategoryLink(a.type)}
                                        className="text-caption transition-opacity hover:opacity-80"
                                        style={{ color: "var(--accent-blue)" }}
                                    >
                                        {a.type.startsWith("budget") ? `Ver transações de ${a.category}` : "Ver metas"} →
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Dismissed alerts */}
                    {dismissed.length > 0 && (
                        <>
                            <div
                                className="flex items-center gap-2 mb-3"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <div className="flex-1 h-[1px]" style={{ background: "var(--border)" }} />
                                <span className="text-caption">Alertas dispensados</span>
                                <div className="flex-1 h-[1px]" style={{ background: "var(--border)" }} />
                            </div>
                            <div className="space-y-3 opacity-50">
                                {dismissed.map((a) => {
                                    const alertStyle = ALERT_ICONS[a.type] || ALERT_ICONS.budget_exceeded;
                                    return (
                                        <div
                                            key={a.id}
                                            className="rounded-[6px] border p-4"
                                            style={{ borderColor: "var(--border)" }}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span style={{ color: alertStyle.color }}>✓</span>
                                                    <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                                        {a.type.startsWith("budget") ? "Orçamento" : "Meta"}
                                                    </span>
                                                </div>
                                                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                                                    {formatDate(a.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                                                {a.message}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

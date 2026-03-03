"use client";

import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { getCategoryColor, ALL_CATEGORIES } from "@/lib/category-colors";
import { getCurrentMonth } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface BudgetData {
    id: string;
    category: string;
    month: string;
    spent: number;
    limit: number;
    pct: number;
    txCount: number;
}

export default function OrcamentosPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [budgets, setBudgets] = useState<BudgetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ category: ALL_CATEGORIES[0], limitAmount: "" });

    useEffect(() => {
        setLoading(true);
        fetch(`/api/budgets?month=${month}`)
            .then((r) => r.json())
            .then((d) => { setBudgets(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [month]);

    async function createBudget() {
        if (!form.limitAmount) return;
        await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: form.category, month, limitAmount: form.limitAmount }),
        });
        setShowModal(false);
        setForm({ category: ALL_CATEGORIES[0], limitAmount: "" });
        // Refresh
        const res = await fetch(`/api/budgets?month=${month}`);
        setBudgets(await res.json());
    }

    const barColor = (pct: number) =>
        pct >= 100 ? "var(--accent-red)" : pct >= 80 ? "var(--accent-amber)" : "var(--accent-green)";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Orçamentos</h1>
                <div className="flex items-center gap-4">
                    <MonthSelector month={month} onChange={setMonth} />
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border text-[13px] transition-colors"
                        style={{
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <Plus size={14} /> Novo orçamento
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {budgets.map((b) => {
                        const colors = getCategoryColor(b.category);
                        const color = barColor(b.pct);
                        return (
                            <div key={b.id} className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                        {b.category}
                                    </span>
                                    <span className="text-caption" style={{ color }}>
                                        {b.pct >= 100 ? "⚠" : "✓"} {b.pct}%
                                    </span>
                                </div>
                                <div className="h-[8px] rounded-full mb-3" style={{ background: "var(--bg-elevated)" }}>
                                    <div
                                        className="h-full rounded-full animate-progress"
                                        style={{ width: `${Math.min(b.pct, 100)}%`, background: color }}
                                    />
                                </div>
                                <div className="flex justify-between text-caption">
                                    <span style={{ color: "var(--text-secondary)" }}>
                                        R$ {b.spent.toLocaleString("pt-BR")} / R$ {b.limit.toLocaleString("pt-BR")}
                                    </span>
                                </div>
                                {b.pct >= 100 && (
                                    <p className="text-caption mt-2" style={{ color: "var(--accent-red)" }}>
                                        Excedido em R$ {(b.spent - b.limit).toLocaleString("pt-BR")}
                                    </p>
                                )}
                                <p className="text-caption mt-1" style={{ color: "var(--text-muted)" }}>
                                    {b.txCount} transações
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="w-[400px] rounded-[6px] border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-h3" style={{ color: "var(--text-primary)" }}>Definir Orçamento</h3>
                            <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Categoria</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                >
                                    {ALL_CATEGORIES.filter((c) => c !== "Receita" && c !== "Salário").map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Mês</label>
                                <input
                                    type="text"
                                    value={month}
                                    readOnly
                                    className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                                />
                            </div>
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Limite mensal</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--text-muted)" }}>R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.limitAmount}
                                        onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full pl-10 pr-3 py-2 rounded-[6px] border text-[13px]"
                                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-[6px] text-[13px]"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createBudget}
                                disabled={!form.limitAmount}
                                className="px-4 py-2 rounded-[6px] text-[13px] disabled:opacity-30"
                                style={{ background: "var(--text-primary)", color: "var(--bg-base)", fontWeight: 590 }}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

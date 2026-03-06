"use client";

import { useEffect, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { CategoryBadge, CategoryPicker } from "@/components/transactions/category-badge";
import { getCategoryColor, ALL_CATEGORIES } from "@/lib/category-colors";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    description: string;
    beneficiary: string;
    category: string;
    type: "receita" | "despesa";
    amount: string;
    categoryConfidence?: "high" | "low" | "manual" | null;
}

interface TransactionData {
    transactions: Transaction[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: { receitas: number; despesas: number; saldo: number; count: number };
}

export default function TransacoesPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (month) params.set("month", month);
        if (category) params.set("category", category);
        if (type) params.set("type", type);
        if (search) params.set("search", search);
        params.set("page", String(page));

        fetch(`/api/transactions?${params}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [month, category, type, search, page]);

    async function updateCategory(txId: string, newCategory: string) {
        await fetch(`/api/transactions/${txId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory }),
        });

        // Update locally
        if (data) {
            setData({
                ...data,
                transactions: data.transactions.map((tx) =>
                    tx.id === txId ? { ...tx, category: newCategory, categoryConfidence: "manual" as const } : tx
                ),
            });
        }
        setEditingId(null);
    }

    const statusIcon = (conf: string | null | undefined) => {
        if (conf === "manual") return { icon: "✏", color: "var(--text-muted)" };
        if (conf === "low") return { icon: "?", color: "var(--accent-amber)" };
        return { icon: "✓", color: "var(--accent-green)" };
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Transações</h1>
                <MonthSelector month={month} onChange={(m) => { setMonth(m); setPage(1); }} />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-[280px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-3 py-2 rounded-[6px] border text-[13px]"
                        style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-[6px] border text-[13px]"
                    style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                    }}
                >
                    <option value="">Categoria</option>
                    {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex rounded-[6px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    {[
                        { value: "", label: "Todas" },
                        { value: "receita", label: "Receitas" },
                        { value: "despesa", label: "Despesas" },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { setType(opt.value); setPage(1); }}
                            className="px-3 py-2 text-[13px] transition-colors"
                            style={{
                                background: type === opt.value ? "var(--bg-elevated)" : "transparent",
                                color: type === opt.value ? "var(--text-primary)" : "var(--text-secondary)",
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary strip */}
            {data && (
                <div
                    className="flex items-center gap-4 px-4 py-2 mb-4 text-[13px] rounded-[6px]"
                    style={{
                        background: "var(--bg-surface)",
                        borderTop: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                    }}
                >
                    <span>Receitas: <strong style={{ color: "var(--accent-green)" }}>R$ {formatBRL(data.summary.receitas)}</strong></span>
                    <span>·</span>
                    <span>Despesas: <strong style={{ color: "var(--accent-red)" }}>R$ {formatBRL(data.summary.despesas)}</strong></span>
                    <span>·</span>
                    <span>Saldo: <strong style={{ color: "var(--text-primary)" }}>R$ {formatBRL(data.summary.saldo)}</strong></span>
                    <span>·</span>
                    <span>{data.summary.count} transações</span>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : data ? (
                <>
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                <th className="text-left py-2 px-2 font-medium w-[40px]" style={{ color: "var(--text-muted)" }}></th>
                                <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--text-muted)" }}>Data</th>
                                <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--text-muted)" }}>Descrição</th>
                                <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--text-muted)" }}>Beneficiário</th>
                                <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--text-muted)" }}>Categoria</th>
                                <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--text-muted)" }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.transactions.map((tx) => {
                                const isIncome = tx.type === "receita";
                                const status = statusIcon(tx.categoryConfidence);
                                return (
                                    <tr
                                        key={tx.id}
                                        className="transition-colors"
                                        style={{ borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <td className="py-2 px-2 text-center" style={{ color: status.color }}>
                                            {status.icon}
                                        </td>
                                        <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>
                                            {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                        </td>
                                        <td className="py-2 px-2" style={{ color: "var(--text-primary)" }}>
                                            {tx.description.length > 35 ? tx.description.slice(0, 35) + "..." : tx.description}
                                        </td>
                                        <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>
                                            {tx.beneficiary}
                                        </td>
                                        <td className="py-2 px-2 relative">
                                            <CategoryBadge
                                                category={tx.category}
                                                confidence={tx.categoryConfidence}
                                                onClick={() => setEditingId(editingId === tx.id ? null : tx.id)}
                                            />
                                            {editingId === tx.id && (
                                                <CategoryPicker
                                                    current={tx.category}
                                                    onSelect={(cat) => updateCategory(tx.id, cat)}
                                                    onClose={() => setEditingId(null)}
                                                />
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-right" style={{ color: isIncome ? "var(--accent-green)" : "var(--accent-red)" }}>
                                            {isIncome ? "+" : "-"}R$ {formatBRL(Math.abs(Number(tx.amount)))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-caption" style={{ color: "var(--text-secondary)" }}>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 disabled:opacity-30 transition-opacity"
                        >
                            <ChevronLeft size={14} /> anterior
                        </button>
                        <span>
                            mostrando {((page - 1) * 25) + 1}–{Math.min(page * 25, data.pagination.total)} de {data.pagination.total} transações
                        </span>
                        <button
                            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                            disabled={page >= data.pagination.totalPages}
                            className="flex items-center gap-1 disabled:opacity-30 transition-opacity"
                        >
                            próxima <ChevronRight size={14} />
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}

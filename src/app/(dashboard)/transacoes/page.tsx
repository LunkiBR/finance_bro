"use client";

import { useEffect, useRef, useState } from "react";
import { MonthSelector } from "@/components/transactions/month-selector";
import { CategoryBadge, CategoryPicker } from "@/components/transactions/category-badge";
import { ALL_CATEGORIES } from "@/lib/category-colors";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { RuleToast, type RuleToastData } from "@/components/transactions/rule-toast";
import { Search, SlidersHorizontal, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    description: string;
    beneficiary: string;
    category: string;
    subcategory?: string | null;
    type: "receita" | "despesa";
    amount: string;
    categoryConfidence?: "high" | "low" | "manual" | null;
}

interface TransactionData {
    transactions: Transaction[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: { receitas: number; despesas: number; saldo: number; count: number };
}

type SortDir = "asc" | "desc";

export default function TransacoesPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Sorting
    const [sortCol, setSortCol] = useState("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Selection
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkPickerOpen, setBulkPickerOpen] = useState(false);

    // Inline editing
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingBeneficiary, setEditingBeneficiary] = useState<{ id: string; value: string } | null>(null);

    // Rule toast
    const [ruleToast, setRuleToast] = useState<RuleToastData | null>(null);

    // Advanced filters
    const [showFilters, setShowFilters] = useState(false);
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const filterRef = useRef<HTMLDivElement>(null);

    const activeFilterCount = [minAmount, maxAmount, startDate, endDate].filter(Boolean).length;

    // Close filter popover on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilters(false);
            }
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    // Fetch transactions
    useEffect(() => {
        setLoading(true);
        const p = new URLSearchParams();
        if (month && !startDate && !endDate) p.set("month", month);
        if (category) p.set("category", category);
        if (type) p.set("type", type);
        if (search) p.set("search", search);
        p.set("sortBy", sortCol);
        p.set("sortDir", sortDir);
        if (minAmount) p.set("minAmount", minAmount);
        if (maxAmount) p.set("maxAmount", maxAmount);
        if (startDate) p.set("startDate", startDate);
        if (endDate) p.set("endDate", endDate);
        p.set("page", String(page));

        fetch(`/api/transactions?${p}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [month, category, type, search, page, sortCol, sortDir, minAmount, maxAmount, startDate, endDate, refreshKey]);

    // ─── Sort ───────────────────────────────────────────────────────────────────
    function handleSort(col: string) {
        if (sortCol === col) {
            if (sortDir === "desc") setSortDir("asc");
            else { setSortCol("date"); setSortDir("desc"); }
        } else {
            setSortCol(col);
            setSortDir("desc");
        }
        setPage(1);
    }

    function SortIcon({ col }: { col: string }) {
        const active = sortCol === col;
        if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.25, marginLeft: 3, flexShrink: 0 }} />;
        return sortDir === "asc"
            ? <ArrowUp size={11} style={{ marginLeft: 3, flexShrink: 0 }} />
            : <ArrowDown size={11} style={{ marginLeft: 3, flexShrink: 0 }} />;
    }

    // ─── Selection ──────────────────────────────────────────────────────────────
    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (!data) return;
        if (selected.size === data.transactions.length) setSelected(new Set());
        else setSelected(new Set(data.transactions.map((tx) => tx.id)));
    }

    // ─── Category update ────────────────────────────────────────────────────────
    async function updateCategory(txId: string, newCategory: string, newSubcategory?: string) {
        await fetch(`/api/transactions/${txId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory, subcategory: newSubcategory || null, pinPayee: true }),
        });

        const tx = data?.transactions.find((t) => t.id === txId);
        if (data) {
            setData({
                ...data,
                transactions: data.transactions.map((t) =>
                    t.id === txId ? { ...t, category: newCategory, subcategory: newSubcategory || null, categoryConfidence: "manual" as const } : t
                ),
            });
        }
        setEditingCategoryId(null);

        // Show rule creation toast
        if (tx && tx.category !== newCategory) {
            setRuleToast({
                txId,
                description: tx.description,
                beneficiary: tx.beneficiary,
                newCategory,
                newSubcategory: newSubcategory || null,
            });
        }
    }

    // ─── Rule creation from toast ────────────────────────────────────────────────
    async function createRuleFromToast(
        matchType: "exact" | "contains",
        matchString: string,
        category: string,
        subcategory?: string | null
    ) {
        try {
            const res = await fetch("/api/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchType,
                    matchString,
                    targetCategory: category,
                    targetSubcategory: subcategory || null,
                }),
            });
            const { rule } = await res.json();
            if (rule?.id) {
                // Apply rule to existing matching transactions
                await fetch("/api/rules/apply", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ruleId: rule.id }),
                });
                setRefreshKey((k) => k + 1);
            }
        } catch (err) {
            console.error("Failed to create rule:", err);
        }
        setRuleToast(null);
    }

    // ─── Beneficiary inline edit ─────────────────────────────────────────────────
    async function saveBeneficiary(txId: string, value: string) {
        if (!value.trim()) { setEditingBeneficiary(null); return; }
        await fetch(`/api/transactions/${txId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ beneficiary: value }),
        });
        if (data) {
            setData({
                ...data,
                transactions: data.transactions.map((tx) =>
                    tx.id === txId ? { ...tx, beneficiary: value } : tx
                ),
            });
        }
        setEditingBeneficiary(null);
    }

    // ─── Bulk actions ───────────────────────────────────────────────────────────
    async function bulkUpdateCategory(cat: string, sub?: string) {
        await Promise.all([...selected].map((id) =>
            fetch(`/api/transactions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: cat, subcategory: sub || null }),
            })
        ));
        if (data) {
            setData({
                ...data,
                transactions: data.transactions.map((tx) =>
                    selected.has(tx.id) ? { ...tx, category: cat, subcategory: sub || null, categoryConfidence: "manual" as const } : tx
                ),
            });
        }
        setSelected(new Set());
        setBulkPickerOpen(false);
    }

    async function deleteSelected() {
        await Promise.all([...selected].map((id) =>
            fetch(`/api/transactions/${id}`, { method: "DELETE" })
        ));
        setSelected(new Set());
        setRefreshKey((k) => k + 1);
    }

    // ─── Export CSV ─────────────────────────────────────────────────────────────
    function exportCSV() {
        if (!data) return;
        const headers = ["Data", "Descrição", "Beneficiário", "Categoria", "Subcategoria", "Tipo", "Valor"];
        const rows = data.transactions.map((tx) => [
            tx.date,
            `"${tx.description.replace(/"/g, '""')}"`,
            `"${(tx.beneficiary || "").replace(/"/g, '""')}"`,
            tx.category,
            tx.subcategory || "",
            tx.type,
            Number(tx.amount).toFixed(2),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transacoes-${month || "filtrado"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Status dot ─────────────────────────────────────────────────────────────
    function statusDot(conf: string | null | undefined) {
        if (conf === "manual") return { color: "var(--text-muted)", title: "Categoria manual" };
        if (conf === "low") return { color: "var(--accent-amber)", title: "Categoria incerta" };
        return { color: "var(--accent-green)", title: "Categoria confirmada" };
    }

    // ─── Date preset helper ──────────────────────────────────────────────────────
    function applyPreset(days: number) {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - days);
        setStartDate(start.toISOString().slice(0, 10));
        setEndDate(now.toISOString().slice(0, 10));
        setMonth("");
        setPage(1);
    }

    function clearFilters() {
        setMinAmount("");
        setMaxAmount("");
        setStartDate("");
        setEndDate("");
        setMonth(getCurrentMonth());
        setPage(1);
    }

    const thStyle = (col: string) => ({
        color: sortCol === col ? "var(--text-primary)" : "var(--text-muted)",
        cursor: "pointer",
        userSelect: "none" as const,
        whiteSpace: "nowrap" as const,
    });

    return (
        <div>
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Transações</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-[13px] transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "transparent" }}
                        title="Exportar CSV"
                    >
                        <Download size={13} />
                        Exportar
                    </button>
                    <MonthSelector
                        month={month}
                        onChange={(m) => { setMonth(m); setStartDate(""); setEndDate(""); setPage(1); }}
                    />
                </div>
            </div>

            {/* ─── Filters row ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-3 py-2 rounded-[6px] border text-[13px]"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                </div>

                {/* Category */}
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-[6px] border text-[13px]"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                    <option value="">Categoria</option>
                    {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Type toggle */}
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

                {/* Advanced filters */}
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border text-[13px] transition-colors"
                        style={{
                            borderColor: activeFilterCount > 0 ? "#5B8FD4" : "var(--border)",
                            color: activeFilterCount > 0 ? "#5B8FD4" : "var(--text-secondary)",
                            background: showFilters ? "var(--bg-surface)" : "transparent",
                        }}
                    >
                        <SlidersHorizontal size={13} />
                        Filtros
                        {activeFilterCount > 0 && (
                            <span
                                className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold"
                                style={{ background: "#5B8FD4", color: "#fff" }}
                            >
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {showFilters && (
                        <div
                            className="absolute top-full left-0 mt-2 z-50 rounded-[8px] border p-4 shadow-xl"
                            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", width: 296 }}
                        >
                            {/* Period presets */}
                            <p className="text-[10px] font-semibold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>PERÍODO</p>
                            <div className="flex gap-1.5 mb-3">
                                {[{ label: "Hoje", days: 0 }, { label: "7 dias", days: 7 }, { label: "30 dias", days: 30 }].map((preset) => {
                                    const now = new Date();
                                    const start = new Date();
                                    start.setDate(now.getDate() - preset.days);
                                    const s = start.toISOString().slice(0, 10);
                                    const e = now.toISOString().slice(0, 10);
                                    const active = startDate === s && endDate === e;
                                    return (
                                        <button
                                            key={preset.label}
                                            onClick={() => applyPreset(preset.days)}
                                            className="px-2.5 py-1 rounded-[4px] border text-[12px] transition-colors"
                                            style={{
                                                borderColor: active ? "#5B8FD4" : "var(--border)",
                                                color: active ? "#5B8FD4" : "var(--text-secondary)",
                                                background: active ? "rgba(59,130,246,0.08)" : "transparent",
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 mb-4">
                                <div className="flex-1">
                                    <label className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>De</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setMonth(""); setPage(1); }}
                                        className="w-full px-2 py-1.5 rounded-[4px] border text-[12px]"
                                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Até</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setMonth(""); setPage(1); }}
                                        className="w-full px-2 py-1.5 rounded-[4px] border text-[12px]"
                                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                    />
                                </div>
                            </div>

                            {/* Amount range */}
                            <p className="text-[10px] font-semibold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>FAIXA DE VALOR</p>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="number"
                                    placeholder="Mín (R$)"
                                    value={minAmount}
                                    onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                                    className="flex-1 px-2 py-1.5 rounded-[4px] border text-[12px]"
                                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                />
                                <input
                                    type="number"
                                    placeholder="Máx (R$)"
                                    value={maxAmount}
                                    onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                                    className="flex-1 px-2 py-1.5 rounded-[4px] border text-[12px]"
                                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <button onClick={clearFilters} className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                                    Limpar filtros
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="px-3 py-1 rounded-[4px] text-[12px] border"
                                    style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Summary strip / Bulk action bar ─────────────────────────────── */}
            {data && (
                selected.size > 0 ? (
                    <div
                        className="flex items-center gap-3 px-4 py-2 mb-4 rounded-[6px] text-[13px]"
                        style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}
                    >
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {selected.size} selecionada{selected.size > 1 ? "s" : ""}
                        </span>
                        <div className="flex-1" />
                        <div className="relative">
                            <button
                                onClick={() => setBulkPickerOpen((v) => !v)}
                                className="px-3 py-1.5 rounded-[6px] border text-[12px] transition-colors"
                                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
                            >
                                Alterar categoria
                            </button>
                            {bulkPickerOpen && (
                                <CategoryPicker
                                    current=""
                                    onSelect={(cat, sub) => bulkUpdateCategory(cat, sub)}
                                    onClose={() => setBulkPickerOpen(false)}
                                />
                            )}
                        </div>
                        <button
                            onClick={deleteSelected}
                            className="px-3 py-1.5 rounded-[6px] border text-[12px] transition-colors"
                            style={{ borderColor: "rgba(184,32,32,0.4)", color: "#B82020", background: "rgba(220,38,38,0.07)" }}
                        >
                            Excluir
                        </button>
                        <button onClick={() => setSelected(new Set())} className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-4 px-4 py-2 mb-4 text-[13px] rounded-[6px]"
                        style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                        <span>Receitas: <strong style={{ color: "var(--accent-green)" }}>R$ {formatBRL(data.summary.receitas)}</strong></span>
                        <span>·</span>
                        <span>Despesas: <strong style={{ color: "var(--accent-red)" }}>R$ {formatBRL(data.summary.despesas)}</strong></span>
                        <span>·</span>
                        <span>Saldo: <strong style={{ color: "var(--text-primary)" }}>R$ {formatBRL(data.summary.saldo)}</strong></span>
                        <span>·</span>
                        <span>{data.summary.count} transações</span>
                    </div>
                )
            )}

            {/* ─── Table ───────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : data ? (
                <>
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {/* Checkbox all */}
                                <th className="py-2 px-2 w-[36px]">
                                    <input
                                        type="checkbox"
                                        checked={!!data.transactions.length && selected.size === data.transactions.length}
                                        onChange={toggleSelectAll}
                                        className="cursor-pointer"
                                        style={{ accentColor: "#5B8FD4" }}
                                    />
                                </th>
                                <th
                                    className="text-left py-2 px-2 font-medium"
                                    style={thStyle("date")}
                                    onClick={() => handleSort("date")}
                                >
                                    <span className="inline-flex items-center">Data <SortIcon col="date" /></span>
                                </th>
                                <th
                                    className="text-left py-2 px-2 font-medium"
                                    style={thStyle("description")}
                                    onClick={() => handleSort("description")}
                                >
                                    <span className="inline-flex items-center">Descrição <SortIcon col="description" /></span>
                                </th>
                                <th
                                    className="text-left py-2 px-2 font-medium"
                                    style={thStyle("beneficiary")}
                                    onClick={() => handleSort("beneficiary")}
                                >
                                    <span className="inline-flex items-center">Beneficiário <SortIcon col="beneficiary" /></span>
                                </th>
                                <th
                                    className="text-left py-2 px-2 font-medium"
                                    style={thStyle("category")}
                                    onClick={() => handleSort("category")}
                                >
                                    <span className="inline-flex items-center">Categoria <SortIcon col="category" /></span>
                                </th>
                                <th
                                    className="text-right py-2 px-2 font-medium"
                                    style={thStyle("amount")}
                                    onClick={() => handleSort("amount")}
                                >
                                    <span className="inline-flex items-center justify-end">Valor <SortIcon col="amount" /></span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.transactions.map((tx) => {
                                const isIncome = tx.type === "receita";
                                const dot = statusDot(tx.categoryConfidence);
                                const isSelected = selected.has(tx.id);

                                return (
                                    <tr
                                        key={tx.id}
                                        className="group transition-colors"
                                        style={{
                                            borderBottom: "1px solid var(--border)",
                                            background: isSelected ? "rgba(59,130,246,0.06)" : "transparent",
                                            cursor: "default",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = isSelected ? "rgba(59,130,246,0.1)" : "var(--bg-surface)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "rgba(59,130,246,0.06)" : "transparent"; }}
                                        onClick={() => { if (!editingBeneficiary) toggleSelect(tx.id); }}
                                    >
                                        {/* Checkbox */}
                                        <td className="py-2 px-2 w-[36px]" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(tx.id)}
                                                className={`cursor-pointer transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                                style={{ accentColor: "#5B8FD4" }}
                                            />
                                        </td>

                                        {/* Date + status dot */}
                                        <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>
                                            <span className="inline-flex items-center gap-1.5">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ background: dot.color }}
                                                    title={dot.title}
                                                />
                                                {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                            </span>
                                        </td>

                                        {/* Description with tooltip */}
                                        <td className="py-2 px-2" style={{ color: "var(--text-primary)" }}>
                                            {tx.description.length > 35 ? (
                                                <span className="relative group/desc cursor-default">
                                                    <span>{tx.description.slice(0, 35)}…</span>
                                                    <span
                                                        className="absolute bottom-full left-0 mb-2 z-50 rounded-md px-3 py-1.5 text-xs text-white shadow-lg pointer-events-none opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-opacity duration-150 delay-500"
                                                        style={{ background: "var(--bg-elevated, #1f2937)", maxWidth: 320, whiteSpace: "normal", lineHeight: "1.4" }}
                                                    >
                                                        {tx.description}
                                                    </span>
                                                </span>
                                            ) : tx.description}
                                        </td>

                                        {/* Beneficiary — inline editable */}
                                        <td
                                            className="py-2 px-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {editingBeneficiary?.id === tx.id ? (
                                                <input
                                                    autoFocus
                                                    value={editingBeneficiary.value}
                                                    onChange={(e) => setEditingBeneficiary({ id: tx.id, value: e.target.value })}
                                                    onBlur={() => saveBeneficiary(tx.id, editingBeneficiary.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveBeneficiary(tx.id, editingBeneficiary.value);
                                                        if (e.key === "Escape") setEditingBeneficiary(null);
                                                    }}
                                                    className="w-full px-1.5 py-0.5 rounded text-[13px]"
                                                    style={{
                                                        background: "var(--bg-surface)",
                                                        border: "1px solid #5B8FD4",
                                                        color: "var(--text-primary)",
                                                        outline: "none",
                                                        minWidth: 100,
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    className="block rounded px-1 -mx-1 cursor-text transition-colors"
                                                    style={{ color: "var(--text-secondary)" }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                                    onClick={() => setEditingBeneficiary({ id: tx.id, value: tx.beneficiary || "" })}
                                                    title="Clique para editar"
                                                >
                                                    {tx.beneficiary || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                                                </span>
                                            )}
                                        </td>

                                        {/* Category badge */}
                                        <td className="py-2 px-2 relative" onClick={(e) => e.stopPropagation()}>
                                            <CategoryBadge
                                                category={tx.category}
                                                subcategory={tx.subcategory}
                                                confidence={tx.categoryConfidence}
                                                onClick={() => setEditingCategoryId(editingCategoryId === tx.id ? null : tx.id)}
                                            />
                                            {editingCategoryId === tx.id && (
                                                <CategoryPicker
                                                    current={tx.category}
                                                    currentSubcategory={tx.subcategory}
                                                    onSelect={(cat, sub) => updateCategory(tx.id, cat, sub)}
                                                    onClose={() => setEditingCategoryId(null)}
                                                />
                                            )}
                                        </td>

                                        {/* Amount — tabular nums */}
                                        <td
                                            className="py-2 px-2 text-right"
                                            style={{
                                                color: isIncome ? "var(--accent-green)" : "var(--accent-red)",
                                                fontVariantNumeric: "tabular-nums",
                                                letterSpacing: "0.01em",
                                            }}
                                        >
                                            {isIncome ? "+" : "-"}R$&nbsp;{formatBRL(Math.abs(Number(tx.amount)))}
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
                            ← anterior
                        </button>
                        <span>
                            {((page - 1) * 25) + 1}–{Math.min(page * 25, data.pagination.total)} de {data.pagination.total}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                            disabled={page >= data.pagination.totalPages}
                            className="flex items-center gap-1 disabled:opacity-30 transition-opacity"
                        >
                            próxima →
                        </button>
                    </div>
                </>
            ) : null}

            {/* Rule creation toast */}
            {ruleToast && (
                <RuleToast
                    data={ruleToast}
                    onCreateRule={createRuleFromToast}
                    onDismiss={() => setRuleToast(null)}
                />
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Plus, X, MoreHorizontal, Pause, Trash, Check } from "lucide-react";

interface GoalData {
    id: string;
    name: string;
    current: number;
    target: number;
    pct: number;
    deadline: string | null;
    status: "active" | "completed" | "paused";
}

export default function MetasPage() {
    const [goals, setGoals] = useState<GoalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [addAmount, setAddAmount] = useState("");
    const [menuId, setMenuId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "", targetAmount: "", currentAmount: "", deadline: "",
    });

    async function loadGoals() {
        const res = await fetch("/api/goals");
        const data = await res.json();
        setGoals(data);
        setLoading(false);
    }

    useEffect(() => { loadGoals(); }, []);

    async function createGoal() {
        if (!form.name || !form.targetAmount) return;
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setShowModal(false);
        setForm({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
        loadGoals();
    }

    async function addToGoal(id: string) {
        if (!addAmount) return;
        await fetch(`/api/goals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addAmount }),
        });
        setAddingTo(null);
        setAddAmount("");
        loadGoals();
    }

    async function updateStatus(id: string, status: string) {
        await fetch(`/api/goals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        setMenuId(null);
        loadGoals();
    }

    async function deleteGoal(id: string) {
        await fetch(`/api/goals/${id}`, { method: "DELETE" });
        setMenuId(null);
        loadGoals();
    }

    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");
    const pausedGoals = goals.filter((g) => g.status === "paused");

    function calcMonthsRemaining(deadline: string | null) {
        if (!deadline) return null;
        const d = new Date(deadline);
        const now = new Date();
        return Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
    }

    function calcRhythm(remaining: number, monthsLeft: number | null) {
        if (!monthsLeft || monthsLeft <= 0) return null;
        return Math.ceil(remaining / monthsLeft);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Metas financeiras</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border text-[13px] transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                    <Plus size={14} /> Nova meta
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <span className="text-body" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {[...activeGoals, ...pausedGoals].map((g) => {
                        const remaining = g.target - g.current;
                        const monthsLeft = calcMonthsRemaining(g.deadline);
                        const rhythm = calcRhythm(remaining, monthsLeft);

                        return (
                            <div
                                key={g.id}
                                className="rounded-[6px] border p-5 relative"
                                style={{
                                    borderColor: "var(--border)",
                                    opacity: g.status === "paused" ? 0.6 : 1,
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[14px]" style={{ color: "var(--text-primary)", fontWeight: 590 }}>
                                        {g.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-caption px-2 py-[1px] rounded-[4px]"
                                            style={{
                                                color: g.status === "active" ? "var(--accent-green)" : "var(--text-muted)",
                                            }}
                                        >
                                            {g.status === "active" ? "Ativa" : "Pausada"}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => setMenuId(menuId === g.id ? null : g.id)}
                                                style={{ color: "var(--text-muted)" }}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {menuId === g.id && (
                                                <div
                                                    className="absolute right-0 top-6 z-50 rounded-[6px] border py-1 min-w-[140px]"
                                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                                                >
                                                    <button
                                                        onClick={() => updateStatus(g.id, g.status === "active" ? "paused" : "active")}
                                                        className="w-full text-left px-3 py-[6px] text-[13px] flex items-center gap-2 transition-colors"
                                                        style={{ color: "var(--text-secondary)" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                    >
                                                        <Pause size={14} /> {g.status === "active" ? "Pausar" : "Retomar"}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGoal(g.id)}
                                                        className="w-full text-left px-3 py-[6px] text-[13px] flex items-center gap-2 transition-colors"
                                                        style={{ color: "var(--accent-red)" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                    >
                                                        <Trash size={14} /> Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-caption mb-2" style={{ color: "var(--text-secondary)" }}>
                                    R$ {g.current.toLocaleString("pt-BR")} de R$ {g.target.toLocaleString("pt-BR")}
                                </p>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 h-[8px] rounded-full" style={{ background: "var(--bg-elevated)" }}>
                                        <div
                                            className="h-full rounded-full animate-progress"
                                            style={{ width: `${Math.min(g.pct, 100)}%`, background: "var(--accent-purple)" }}
                                        />
                                    </div>
                                    <span className="text-caption" style={{ color: "var(--accent-purple)" }}>{g.pct}%</span>
                                </div>

                                <div className="text-caption space-y-1" style={{ color: "var(--text-muted)" }}>
                                    {g.deadline && (
                                        <p>Prazo: {new Date(g.deadline).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · Faltam {monthsLeft} meses</p>
                                    )}
                                    {remaining > 0 && <p>Faltam R$ {remaining.toLocaleString("pt-BR")}</p>}
                                    {rhythm && <p>Ritmo necessário: R$ {rhythm.toLocaleString("pt-BR")}/mês</p>}
                                </div>

                                {/* Add value */}
                                <div className="mt-4">
                                    {addingTo === g.id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--text-muted)" }}>+ R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={addAmount}
                                                    onChange={(e) => setAddAmount(e.target.value)}
                                                    className="w-full pl-12 pr-3 py-2 rounded-[6px] border text-[13px]"
                                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === "Enter" && addToGoal(g.id)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => addToGoal(g.id)}
                                                disabled={!addAmount}
                                                className="px-3 py-2 rounded-[6px] text-[13px] disabled:opacity-30"
                                                style={{ background: "var(--text-primary)", color: "var(--bg-base)", fontWeight: 590 }}
                                            >
                                                Registrar
                                            </button>
                                            <button onClick={() => { setAddingTo(null); setAddAmount(""); }} style={{ color: "var(--text-muted)" }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingTo(g.id)}
                                            className="text-caption transition-opacity hover:opacity-80"
                                            style={{ color: "var(--accent-blue)" }}
                                        >
                                            Atualizar valor
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Completed goals */}
                    {completedGoals.map((g) => (
                        <div
                            key={g.id}
                            className="rounded-[6px] border p-5"
                            style={{ borderColor: "var(--border)", opacity: 0.6 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[14px] flex items-center gap-2" style={{ color: "var(--text-primary)", fontWeight: 590 }}>
                                    <Check size={16} style={{ color: "var(--accent-green)" }} />
                                    {g.name}
                                </span>
                                <span className="text-caption" style={{ color: "var(--accent-green)" }}>Concluída</span>
                            </div>
                            <p className="text-caption mb-2" style={{ color: "var(--text-secondary)" }}>
                                R$ {g.target.toLocaleString("pt-BR")} de R$ {g.target.toLocaleString("pt-BR")}
                            </p>
                            <div className="h-[8px] rounded-full" style={{ background: "var(--bg-elevated)" }}>
                                <div className="h-full rounded-full w-full" style={{ background: "var(--accent-green)" }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Goal Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="w-[400px] rounded-[6px] border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-h3" style={{ color: "var(--text-primary)" }}>Nova Meta</h3>
                            <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Nome da meta</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Valor alvo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--text-muted)" }}>R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.targetAmount}
                                        onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-[6px] border text-[13px]"
                                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Valor atual acumulado (opcional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--text-muted)" }}>R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.currentAmount}
                                        onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-[6px] border text-[13px]"
                                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-caption block mb-1" style={{ color: "var(--text-secondary)" }}>Prazo (opcional)</label>
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                    className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-[6px] text-[13px]" style={{ color: "var(--text-secondary)" }}>
                                Cancelar
                            </button>
                            <button
                                onClick={createGoal}
                                disabled={!form.name || !form.targetAmount}
                                className="px-4 py-2 rounded-[6px] text-[13px] disabled:opacity-30"
                                style={{ background: "var(--text-primary)", color: "var(--bg-base)", fontWeight: 590 }}
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

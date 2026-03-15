"use client";

import { Lock, X, Repeat2, CheckCircle, CreditCard, ChevronDown } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { CATEGORY_TAXONOMY } from "@/lib/categories";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface RecurringItem {
    beneficiary: string;
    category: string;
    avgAmount: number;
    monthCount: number;
    installment?: { current: number; total: number; monthsRemaining: number; paidCount?: number } | null;
}

interface CommittedBreakdownData {
    committedAmount: number;
    committedPct: number;
    variableAmount: number;
    variablePct: number;
    freeAmount: number;
    freePct: number;
    commitmentLevel: "critical" | "high" | "moderate" | "healthy";
}

interface CommittedBreakdownProps {
    breakdown: CommittedBreakdownData;
    recurringItems: RecurringItem[];
    receitas: number;
}

const STORAGE_KEY = "ff_excluded_recurring_v1";

const SUBSCRIPTION_KEYWORDS = [
    "netflix", "spotify", "amazon", "disney", "hbo", "youtube", "adobe", "canva",
    "notion", "vercel", "supabase", "github", "linear", "figma", "openai", "anthropic",
    "claude", "chatgpt", "google one", "icloud", "microsoft", "office", "dropbox",
    "slack", "zoom", "asana", "hubspot", "intercom", "datadog", "sentry", "twilio",
    "cursor", "copilot", "grammarly", "evernote", "trello", "airtable", "webflow",
    "shopify", "stripe", "cloudflare", "digitalocean", "aws ", "azure", "gcp",
    "nubank premium", "inter premium", "c6 premium",
];
const SUBSCRIPTION_CATEGORIES = ["assinatura", "streaming", "software", "saas", "serviço digital"];

function detectSubscription(item: RecurringItem): boolean {
    const name = item.beneficiary.toLowerCase();
    const cat = (item.category ?? "").toLowerCase();
    return (
        SUBSCRIPTION_KEYWORDS.some((k) => name.includes(k)) ||
        SUBSCRIPTION_CATEGORIES.some((c) => cat.includes(c))
    );
}

function levelColor(level: CommittedBreakdownData["commitmentLevel"]): string {
    if (level === "critical") return "#E5484D";
    if (level === "high") return "#F76B15";
    if (level === "moderate") return "#f97316";
    return "#30A46C";
}

function levelLabel(level: CommittedBreakdownData["commitmentLevel"]): string {
    if (level === "critical") return "Comprometimento crítico";
    if (level === "high") return "Alto comprometimento";
    if (level === "moderate") return "Moderado";
    return "Saudável";
}

const EXPENSE_CATEGORIES = Object.entries(CATEGORY_TAXONOMY)
    .filter(([, info]) => info.type === "despesa" || info.type === "ambos")
    .map(([name]) => name);

function CategoryBadge({ item, onCategoryChange }: { item: RecurringItem; onCategoryChange: (beneficiary: string, category: string) => void }) {
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const isSub = detectSubscription(item);

    useEffect(() => {
        if (!dropdownPos) return;
        function handlePointerDown(e: MouseEvent) {
            if (
                btnRef.current?.contains(e.target as Node) ||
                dropRef.current?.contains(e.target as Node)
            ) return;
            setDropdownPos(null);
        }
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [dropdownPos]);

    function toggle() {
        if (dropdownPos) { setDropdownPos(null); return; }
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }

    const label = isSub ? "assinatura" : item.category;
    const badgeStyle = isSub
        ? { background: "#8B5CF618", color: "#8B5CF6", border: "1px solid #8B5CF630" }
        : { background: "var(--bg-elevated)", color: "var(--text-muted)" };

    const dropdown = dropdownPos && createPortal(
        <div
            ref={dropRef}
            style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                zIndex: 99999,
                width: 200,
                maxHeight: 240,
                overflowY: "auto",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#1a1a1a",
                boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                padding: "4px 0",
            }}
        >
            {EXPENSE_CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onMouseDown={(e) => { e.preventDefault(); onCategoryChange(item.beneficiary, cat); setDropdownPos(null); }}
                    style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 11,
                        padding: "6px 12px",
                        color: cat === item.category ? "var(--accent-blue, #3b82f6)" : "var(--text-secondary)",
                        background: cat === item.category ? "rgba(255,255,255,0.06)" : "transparent",
                        fontWeight: cat === item.category ? 500 : 400,
                        border: "none",
                        cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                    {cat}
                </button>
            ))}
        </div>,
        document.body
    );

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                className="text-[10px] px-1.5 py-0.5 rounded-[3px] flex items-center gap-0.5 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                style={badgeStyle}
            >
                {label}
                <ChevronDown size={9} />
            </button>
            {dropdown}
        </>
    );
}

export function CommittedBreakdown({ breakdown, recurringItems, receitas }: CommittedBreakdownProps) {
    const [excluded, setExcluded] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [localCategories, setLocalCategories] = useState<Record<string, string>>({});

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
            if (Array.isArray(stored)) setExcluded(stored);
        } catch { /* ignore */ }
    }, []);

    async function handleCategoryChange(beneficiary: string, category: string) {
        // Optimistic update
        setLocalCategories(prev => ({ ...prev, [beneficiary]: category }));
        try {
            await fetch("/api/beneficiary/reclassify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ beneficiary, category }),
            });
        } catch { /* ignore — optimistic UI stays */ }
    }

    // Apply local category overrides
    const itemsWithOverrides = recurringItems.map(r =>
        localCategories[r.beneficiary] ? { ...r, category: localCategories[r.beneficiary] } : r
    );

    function excludeItem(beneficiary: string) {
        const next = [...new Set([...excluded, beneficiary])];
        setExcluded(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }

    // Recalculate adjusted values after exclusions
    const excludedTotal = itemsWithOverrides
        .filter((r) => excluded.includes(r.beneficiary))
        .reduce((s, r) => s + r.avgAmount, 0);

    const adjustedCommitted = Math.max(0, breakdown.committedAmount - excludedTotal);
    const adjustedFree = breakdown.freeAmount + excludedTotal;
    const adjustedCommittedPct = receitas > 0 ? Math.round((adjustedCommitted / receitas) * 100) : 0;
    const adjustedVariablePct = breakdown.variablePct;
    const adjustedFreePct = Math.max(0, 100 - adjustedCommittedPct - adjustedVariablePct);
    const adjustedLevel: CommittedBreakdownData["commitmentLevel"] =
        adjustedCommittedPct > 80 ? "critical"
        : adjustedCommittedPct > 60 ? "high"
        : adjustedCommittedPct > 40 ? "moderate"
        : "healthy";

    const statusColor = levelColor(adjustedLevel);
    const activeItems = itemsWithOverrides.filter((r) => !excluded.includes(r.beneficiary));

    // Split into automatic charges vs installments
    const autoItems = activeItems.filter((r) => !r.installment);
    const installmentItems = activeItems.filter((r) => r.installment != null);

    // For show more/less — applies to autoItems only
    const visibleAuto = showAll ? autoItems : autoItems.slice(0, 5);
    const hiddenCount = autoItems.length - 5;

    function renderItem(item: RecurringItem) {
        const isSub = detectSubscription(item);
        return (
            <div
                key={item.beneficiary}
                className="flex items-center justify-between py-1.5 border-b last:border-b-0 group"
                style={{ borderColor: "var(--border)" }}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isSub ? (
                        <Repeat2 size={11} style={{ color: "#8B5CF6", flexShrink: 0 }} />
                    ) : (
                        <Lock size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    )}
                    <span
                        className="text-[12px] truncate"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {item.beneficiary}
                    </span>
                    <CategoryBadge item={item} onCategoryChange={handleCategoryChange} />
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                        className="text-[12px]"
                        style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                        R$ {formatBRL(item.avgAmount)}
                    </span>
                    <button
                        onClick={() => excludeItem(item.beneficiary)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-80"
                        title="Não vai mais acontecer"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>
        );
    }

    function renderInstallmentItem(item: RecurringItem) {
        const inst = item.installment!;
        return (
            <div
                key={item.beneficiary}
                className="py-1.5 border-b last:border-b-0 group"
                style={{ borderColor: "var(--border)" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CreditCard size={11} style={{ color: "#60a5fa", flexShrink: 0 }} />
                        <span
                            className="text-[12px] truncate"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {item.beneficiary}
                        </span>
                        <span
                            className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-[3px]"
                            style={{ background: "#60a5fa18", color: "#60a5fa", border: "1px solid #60a5fa30" }}
                        >
                            {String(inst.current).padStart(2, "0")}/{String(inst.total).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                            {inst.monthsRemaining === 0 ? "última parcela" : `${inst.monthsRemaining} restantes`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                            className="text-[12px]"
                            style={{ color: "var(--text-primary)", fontWeight: 500 }}
                        >
                            R$ {formatBRL(item.avgAmount)}
                        </span>
                        <button
                            onClick={() => excludeItem(item.beneficiary)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-80"
                            title="Não vai mais acontecer"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <X size={13} />
                        </button>
                    </div>
                </div>
                {/* Segmented installment progress bar */}
                <div className="mt-1.5 ml-5 flex gap-[3px]">
                    {Array.from({ length: inst.total }).map((_, i) => {
                        const paid = i < (inst.paidCount ?? inst.current - 1);
                        const isFirst = i === 0;
                        const isLast = i === inst.total - 1;
                        return (
                            <div
                                key={i}
                                className="h-[3px] flex-1"
                                style={{
                                    background: paid ? "#60a5fa" : "var(--bg-elevated)",
                                    borderRadius: isFirst
                                        ? "9999px 0 0 9999px"
                                        : isLast
                                        ? "0 9999px 9999px 0"
                                        : "0",
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-h3" style={{ color: "var(--text-primary)" }}>
                        Renda Comprometida
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span
                            className="text-[22px] font-semibold tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                        >
                            R$ {formatBRL(adjustedCommitted)}
                        </span>
                        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            /mês automático
                        </span>
                    </div>
                </div>
                <div
                    className="text-[11px] px-2 py-1 rounded-[4px] shrink-0 mt-0.5"
                    style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                        fontWeight: 500,
                        border: `1px solid ${statusColor}30`,
                    }}
                >
                    {levelLabel(adjustedLevel)}
                </div>
            </div>

            {/* Stacked bar */}
            <div className="mb-4">
                <div
                    className="flex h-[8px] rounded-full overflow-hidden w-full"
                    style={{ background: "var(--bg-elevated)" }}
                >
                    {adjustedCommittedPct > 0 && (
                        <div style={{ width: `${adjustedCommittedPct}%`, background: statusColor, height: "100%", transition: "width 0.5s ease" }} />
                    )}
                    {adjustedVariablePct > 0 && (
                        <div style={{ width: `${adjustedVariablePct}%`, background: "#f97316", height: "100%", transition: "width 0.5s ease" }} />
                    )}
                    {adjustedFreePct > 0 && (
                        <div style={{ width: `${adjustedFreePct}%`, background: "#30A46C", height: "100%", transition: "width 0.5s ease" }} />
                    )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: statusColor }} />
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Fixo <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>R$ {formatBRL(adjustedCommitted)}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "#f97316" }} />
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Variável <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>R$ {formatBRL(breakdown.variableAmount)}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "#30A46C" }} />
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Livre <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>R$ {formatBRL(Math.max(0, adjustedFree))}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Items */}
            {activeItems.length > 0 ? (
                <div>
                    {/* ── Cobranças Automáticas ── */}
                    {autoItems.length > 0 && (
                        <div>
                            <p
                                className="text-[11px] uppercase tracking-wide mb-2"
                                style={{ color: "var(--text-muted)", fontWeight: 500 }}
                            >
                                Cobranças Automáticas
                            </p>
                            <div>
                                {visibleAuto.map((item) => renderItem(item))}
                            </div>

                            {hiddenCount > 0 && !showAll && (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="text-[11px] mt-2 transition-opacity hover:opacity-80"
                                    style={{ color: "var(--accent-blue, #3b82f6)" }}
                                >
                                    + {hiddenCount} outros recorrentes
                                </button>
                            )}
                            {showAll && hiddenCount > 0 && (
                                <button
                                    onClick={() => setShowAll(false)}
                                    className="text-[11px] mt-2 transition-opacity hover:opacity-80"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    ver menos
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Parcelas em Andamento ── */}
                    {installmentItems.length > 0 && (
                        <div className={autoItems.length > 0 ? "mt-4" : ""}>
                            <p
                                className="text-[11px] uppercase tracking-wide mb-2"
                                style={{ color: "var(--text-muted)", fontWeight: 500 }}
                            >
                                Parcelas em Andamento
                            </p>
                            <div>
                                {installmentItems.map((item) => renderInstallmentItem(item))}
                            </div>
                        </div>
                    )}

                    {/* Excluded items hint */}
                    {excluded.length > 0 && (
                        <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                            {excluded.length} {excluded.length === 1 ? "item removido" : "itens removidos"} desta lista.{" "}
                            <button
                                onClick={() => {
                                    setExcluded([]);
                                    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
                                }}
                                className="underline hover:opacity-80 transition-opacity"
                            >
                                Restaurar
                            </button>
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 py-2">
                    <CheckCircle size={13} style={{ color: "#30A46C" }} />
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {excluded.length > 0
                            ? `Todos os itens foram removidos. `
                            : "Nenhum gasto recorrente identificado ainda."}
                        {excluded.length > 0 && (
                            <button
                                onClick={() => {
                                    setExcluded([]);
                                    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
                                }}
                                className="underline hover:opacity-80 transition-opacity"
                                style={{ color: "var(--accent-blue, #3b82f6)" }}
                            >
                                Restaurar
                            </button>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}

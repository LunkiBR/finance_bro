interface BudgetMiniProps {
    category: string;
    spent: number;
    limit: number;
}

export function BudgetMini({ category, spent, limit }: BudgetMiniProps) {
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const barColor =
        pct >= 100
            ? "var(--accent-red)"
            : pct >= 80
                ? "var(--accent-amber)"
                : "var(--accent-green)";

    const statusIcon = pct >= 100 ? "⚠" : "✓";
    const statusLabel = pct >= 100 ? "Excedido" : `${pct}%`;

    return (
        <div className="flex items-center gap-3 py-2">
            <span
                className="text-[13px] w-[120px] shrink-0 truncate"
                style={{ color: "var(--text-secondary)" }}
            >
                {category}
            </span>
            <div className="flex-1 relative">
                <div
                    className="h-[6px] rounded-full w-full"
                    style={{ background: "var(--bg-elevated)" }}
                >
                    <div
                        className="h-full rounded-full animate-progress"
                        style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: barColor,
                        }}
                    />
                </div>
            </div>
            <span className="text-caption shrink-0 w-[160px] text-right" style={{ color: "var(--text-secondary)" }}>
                R$ {spent.toLocaleString("pt-BR")} / R$ {limit.toLocaleString("pt-BR")}
            </span>
            <span className="text-caption shrink-0 w-[70px] text-right" style={{ color: barColor }}>
                {statusIcon} {statusLabel}
            </span>
        </div>
    );
}

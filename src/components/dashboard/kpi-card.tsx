import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;                     // second line below value
    delta?: number;                        // raw absolute change (R$ diff or pp diff)
    deltaFormat?: "currency" | "pp";       // "currency" → R$, "pp" → percentage points
    deltaLabel?: string;                   // e.g. "vs mês passado"
    icon?: React.ReactNode;
    positiveIsGood?: boolean;              // default true
    warning?: boolean;                     // red background state (e.g. negative freeToSpend)
    barPct?: number;                       // 0-100 → renders thin progress bar at bottom
    barColor?: string;                     // bar color override
}

function formatDelta(delta: number, format: "currency" | "pp"): string {
    const sign = delta > 0 ? "+" : "";
    if (format === "currency") {
        const abs = Math.abs(delta);
        const formatted = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(abs);
        return delta < 0 ? `-R$ ${formatted}` : `+R$ ${formatted}`;
    }
    return `${sign}${delta}pp`;
}

export function KpiCard({
    title, value, subtitle, delta, deltaFormat = "currency", deltaLabel,
    icon, positiveIsGood = true, warning = false, barPct, barColor,
}: KpiCardProps) {
    const isPositive = delta !== undefined && delta > 0;

    const deltaColor =
        delta === undefined || delta === 0
            ? "var(--text-muted)"
            : isPositive
                ? (positiveIsGood ? "var(--accent-green)" : "var(--accent-red)")
                : (positiveIsGood ? "var(--accent-red)" : "var(--accent-green)");

    const DeltaIcon =
        delta === undefined || delta === 0
            ? Minus
            : isPositive ? TrendingUp : TrendingDown;

    const barFill = barColor ?? "var(--accent-purple)";

    return (
        <div
            className="rounded-[6px] border p-4 flex flex-col justify-between"
            style={{
                borderColor: warning ? "rgba(229,72,77,0.3)" : "var(--border)",
                background: warning ? "rgba(229,72,77,0.06)" : undefined,
            }}
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-caption" style={{ color: "var(--text-secondary)" }}>
                        {title}
                    </span>
                    {warning ? (
                        <AlertCircle size={14} style={{ color: "var(--accent-red)" }} />
                    ) : icon ? (
                        <span style={{ color: "var(--text-muted)" }}>{icon}</span>
                    ) : null}
                </div>
                <p
                    className="text-[28px] mb-1 leading-none"
                    style={{
                        color: warning ? "var(--accent-red)" : "var(--text-primary)",
                        fontWeight: 590,
                        letterSpacing: "-0.5px",
                    }}
                >
                    {value}
                </p>
                {subtitle && (
                    <p className="text-caption mt-1 leading-snug" style={{ color: "var(--text-muted)" }}>
                        {subtitle}
                    </p>
                )}
                {delta !== undefined && delta !== 0 && (
                    <div className="flex items-center gap-1 mt-1">
                        <DeltaIcon size={12} style={{ color: deltaColor }} />
                        <span className="text-caption" style={{ color: deltaColor }}>
                            {formatDelta(delta, deltaFormat)}
                            {deltaLabel ? ` ${deltaLabel}` : ""}
                        </span>
                    </div>
                )}
                {(delta === undefined || delta === 0) && deltaLabel && !subtitle && (
                    <div className="flex items-center gap-1 mt-1">
                        <Minus size={12} style={{ color: "var(--text-muted)" }} />
                        <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                            sem variação {deltaLabel}
                        </span>
                    </div>
                )}
            </div>

            {barPct !== undefined && (
                <div className="mt-3">
                    <div className="h-[3px] rounded-full w-full" style={{ background: "var(--bg-elevated)" }}>
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(Math.max(barPct, 0), 100)}%`, background: barFill }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

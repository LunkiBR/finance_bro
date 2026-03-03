import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string;
    delta?: number;           // percentage change
    deltaLabel?: string;       // e.g. "vs mês passado"
    icon?: React.ReactNode;
    positiveIsGood?: boolean;  // default true; set false for "Total Gasto" where decrease is good
}

export function KpiCard({ title, value, delta, deltaLabel, icon, positiveIsGood = true }: KpiCardProps) {
    const isPositive = delta !== undefined && delta > 0;
    const isNegative = delta !== undefined && delta < 0;

    // When positiveIsGood=true: up = green, down = red
    // When positiveIsGood=false (expenses): up = red, down = green
    const deltaColor =
        delta === undefined || delta === 0
            ? "var(--text-muted)"
            : isPositive
                ? (positiveIsGood ? "var(--accent-green)" : "var(--accent-red)")
                : (positiveIsGood ? "var(--accent-red)" : "var(--accent-green)");

    const DeltaIcon =
        delta === undefined || delta === 0
            ? Minus
            : isPositive
                ? TrendingUp
                : TrendingDown;

    return (
        <div
            className="rounded-[6px] border p-4"
            style={{ borderColor: "var(--border)" }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-caption" style={{ color: "var(--text-secondary)" }}>
                    {title}
                </span>
                {icon && (
                    <span style={{ color: "var(--text-muted)" }}>{icon}</span>
                )}
            </div>
            <p
                className="text-[28px] mb-1"
                style={{
                    color: "var(--text-primary)",
                    fontWeight: 590,
                    letterSpacing: "-0.5px",
                }}
            >
                {value}
            </p>
            {delta !== undefined && (
                <div className="flex items-center gap-1">
                    <DeltaIcon size={12} style={{ color: deltaColor }} />
                    <span className="text-caption" style={{ color: deltaColor }}>
                        {delta > 0 ? "+" : ""}
                        {delta}%
                        {deltaLabel ? ` ${deltaLabel}` : ""}
                    </span>
                </div>
            )}
        </div>
    );
}

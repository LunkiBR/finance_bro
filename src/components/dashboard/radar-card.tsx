import Link from "next/link";

interface RadarCardProps {
    icon: string;
    title: string;
    description: string;
    linkHref: string;
}

// Determine semantic color from icon
function iconColor(icon: string): string {
    if (icon === "⚠" || icon === "⚡") return "var(--accent-amber)";
    if (icon === "✓" || icon === "🏆") return "var(--accent-green)";
    if (icon === "🎯" || icon === "📊") return "var(--accent-blue)";
    return "var(--text-muted)";
}

function borderColor(icon: string): string {
    if (icon === "⚠" || icon === "⚡") return "rgba(245,158,11,0.5)";
    if (icon === "✓" || icon === "🏆") return "rgba(0,166,126,0.5)";
    if (icon === "🎯" || icon === "📊") return "rgba(59,130,246,0.5)";
    return "var(--border)";
}

export function RadarCard({ icon, title, description, linkHref }: RadarCardProps) {
    return (
        <div
            className="min-w-[280px] rounded-[6px] border p-4 flex flex-col justify-between shrink-0"
            style={{
                borderColor: "var(--border)",
                borderLeft: `3px solid ${borderColor(icon)}`,
                background: "var(--bg-surface)",
            }}
        >
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 14, lineHeight: 1, color: iconColor(icon) }}>{icon}</span>
                    <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {title}
                    </span>
                </div>
                <p className="text-caption leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {description}
                </p>
            </div>
            <Link
                href={linkHref}
                className="text-caption mt-3 inline-flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: "var(--accent-blue)" }}
            >
                Ver detalhes →
            </Link>
        </div>
    );
}

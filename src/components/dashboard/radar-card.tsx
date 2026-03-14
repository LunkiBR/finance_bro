import Link from "next/link";

interface RadarCardProps {
    icon: string;
    title: string;
    description: string;
    linkHref: string;
}

function accentColor(icon: string): string {
    if (icon === "⚠" || icon === "⚡") return "#F59E0B";
    if (icon === "✓" || icon === "🏆") return "#00A67E";
    if (icon === "🎯" || icon === "📊") return "#3B82F6";
    return "var(--text-muted)";
}

function accentBg(icon: string): string {
    if (icon === "⚠" || icon === "⚡") return "rgba(245,158,11,0.08)";
    if (icon === "✓" || icon === "🏆") return "rgba(0,166,126,0.08)";
    if (icon === "🎯" || icon === "📊") return "rgba(59,130,246,0.08)";
    return "transparent";
}

export function RadarCard({ icon, title, description, linkHref }: RadarCardProps) {
    const dot = accentColor(icon);
    const bg = accentBg(icon);

    return (
        <div
            className="rounded-[6px] border p-4 flex flex-col gap-2"
            style={{
                borderColor: "var(--border)",
                background: bg,
            }}
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: dot }}
                />
                <span
                    className="text-[13px] leading-snug"
                    style={{ color: "var(--text-primary)", fontWeight: 500 }}
                >
                    {title}
                </span>
            </div>

            <p
                className="text-[12px] leading-[1.65]"
                style={{ color: "var(--text-secondary)" }}
            >
                {description}
            </p>

            <Link
                href={linkHref}
                className="text-[11px] mt-auto pt-1 transition-opacity hover:opacity-70"
                style={{ color: dot }}
            >
                Ver detalhes →
            </Link>
        </div>
    );
}

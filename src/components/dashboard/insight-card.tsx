import Link from "next/link";

interface InsightCardProps {
    icon: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
}

export function InsightCard({ icon, title, description, linkText, linkHref }: InsightCardProps) {
    return (
        <div
            className="rounded-[6px] border p-4 flex flex-col justify-between"
            style={{ borderColor: "var(--border)" }}
        >
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span>{icon}</span>
                    <span
                        className="text-[13px]"
                        style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                        {title}
                    </span>
                </div>
                <p
                    className="text-caption leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {description}
                </p>
            </div>
            <Link
                href={linkHref}
                className="text-caption mt-3 inline-flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: "var(--accent-blue)" }}
            >
                {linkText} →
            </Link>
        </div>
    );
}

interface GoalMiniProps {
    name: string;
    current: number;
    target: number;
    deadline?: string;
}

export function GoalMini({ name, current, target, deadline }: GoalMiniProps) {
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    const remaining = target - current;

    // Calculate months remaining
    let monthsRemaining: number | null = null;
    if (deadline) {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        monthsRemaining = Math.max(
            0,
            (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
            (deadlineDate.getMonth() - now.getMonth())
        );
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {name}
                </span>
                <span className="text-caption" style={{ color: "var(--accent-purple)" }}>
                    {pct}%
                </span>
            </div>
            <div
                className="h-[6px] rounded-full w-full mb-2"
                style={{ background: "var(--bg-elevated)" }}
            >
                <div
                    className="h-full rounded-full animate-progress"
                    style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: "var(--accent-purple)",
                    }}
                />
            </div>
            <div className="flex items-center gap-2 text-caption" style={{ color: "var(--text-muted)" }}>
                <span>
                    R$ {current.toLocaleString("pt-BR")} / R$ {target.toLocaleString("pt-BR")}
                </span>
                {monthsRemaining !== null && (
                    <>
                        <span>·</span>
                        <span>Faltam {monthsRemaining} meses</span>
                    </>
                )}
                {remaining > 0 && (
                    <>
                        <span>·</span>
                        <span>R$ {remaining.toLocaleString("pt-BR")} restantes</span>
                    </>
                )}
            </div>
        </div>
    );
}

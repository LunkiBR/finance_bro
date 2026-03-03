const TOOL_LABELS: Record<string, string> = {
    query_transactions: "Consultando transações...",
    get_monthly_summary: "Calculando resumo mensal...",
    get_budget_status: "Verificando orçamentos...",
    get_goals: "Consultando metas...",
    create_chart: "Criando gráfico...",
};

interface ToolIndicatorProps {
    tool: string;
}

export function ToolIndicator({ tool }: ToolIndicatorProps) {
    const label = TOOL_LABELS[tool] || "Processando...";

    return (
        <div className="flex items-center gap-2 mb-4">
            <span
                className="w-[6px] h-[6px] rounded-full animate-pulse-dot"
                style={{ background: "var(--accent-blue)" }}
            />
            <span
                className="text-caption"
                style={{ color: "var(--text-muted)" }}
            >
                {label}
            </span>
        </div>
    );
}

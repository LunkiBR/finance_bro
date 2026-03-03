"use client";

import { BarChart3, ArrowUpRight, Target, Lightbulb } from "lucide-react";

interface ChatSuggestionsProps {
    onSelect: (message: string) => void;
    userName?: string;
}

const suggestions = [
    { label: "Me mostre um resumo do mês", icon: BarChart3 },
    { label: "Compare meus gastos com o mês anterior", icon: ArrowUpRight },
    { label: "Como estão minhas metas financeiras?", icon: Target },
    { label: "Me dá uma dica para economizar", icon: Lightbulb },
];

export function ChatSuggestions({ onSelect, userName }: ChatSuggestionsProps) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 px-4">
            <h1
                className="text-h2 mb-1"
                style={{ color: "var(--text-primary)" }}
            >
                Olá{userName ? `, ${userName}` : ""}.
            </h1>
            <p
                className="text-body mb-8"
                style={{ color: "var(--text-secondary)" }}
            >
                O que você quer saber?
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-[500px]">
                {suggestions.map((s) => (
                    <button
                        key={s.label}
                        onClick={() => onSelect(s.label)}
                        className="flex items-start gap-3 p-4 rounded-[6px] border text-left text-[13px] transition-colors group"
                        style={{
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <span className="flex-1">{s.label}</span>
                        <s.icon size={16} style={{ color: "var(--text-muted)", marginTop: "2px" }} />
                    </button>
                ))}
            </div>
        </div>
    );
}

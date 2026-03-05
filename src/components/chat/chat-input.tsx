"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

const QUICK_ACTIONS = [
    "Resumo do mês",
    "Quanto gastei em...",
    "Comparar meses",
    "Minhas metas",
    "Criar alerta",
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
    }, [value]);

    function handleSend() {
        if (!value.trim() || disabled) return;
        onSend(value.trim());
        setValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="w-full">
            {/* Quick prompts — only show when not loading */}
            {!disabled && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action}
                            onClick={() => onSend(action)}
                            className="shrink-0 px-3 py-[6px] rounded-full border text-[13px] whitespace-nowrap transition-all"
                            style={{
                                background: "var(--bg-elevated)",
                                borderColor: "var(--border)",
                                color: "var(--text-secondary)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--border-strong)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }}
                        >
                            {action}
                        </button>
                    ))}
                </div>
            )}

            {/* ChatGPT-style pill input */}
            <div
                className="relative flex items-end rounded-[16px] border px-4 py-3 transition-all"
                style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5)",
                }}
            >
                {/* "+" / attach stub (decorative, matches ChatGPT left icon) */}
                <div
                    className="mr-3 shrink-0 mb-[2px]"
                    style={{ color: "var(--text-muted)" }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte alguma coisa"
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent resize-none text-[15px] outline-none leading-relaxed"
                    style={{
                        color: "var(--text-primary)",
                        maxHeight: "200px",
                        caretColor: "var(--accent-blue)",
                    }}
                />

                {/* Send button — blue circle like ChatGPT */}
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className="ml-3 shrink-0 mb-[2px] w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: value.trim() && !disabled ? "var(--accent-blue)" : "var(--bg-surface)",
                        color: value.trim() && !disabled ? "#fff" : "var(--text-muted)",
                        opacity: disabled && value.trim() ? 0.5 : 1,
                    }}
                >
                    {disabled
                        ? (
                            <div
                                className="w-[14px] h-[14px] rounded-sm"
                                style={{ background: "currentColor" }}
                            />
                        )
                        : <ArrowUp size={16} />
                    }
                </button>
            </div>

            <p className="text-center text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                Finance Friend pode cometer erros. Confira as informações importantes.
            </p>
        </div>
    );
}

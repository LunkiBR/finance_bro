"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus } from "lucide-react";

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
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 px-1 no-scrollbar" style={{ scrollbarWidth: "none" }}>
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
                    <div className="w-4 shrink-0" /> {/* Extra padding for scroll-end */}
                </div>
            )}

            {/* Perplexity-style pill input */}
            <div
                className="relative flex items-end rounded-[32px] border px-3 py-2.5 transition-all"
                style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5)",
                    minHeight: "56px"
                }}
            >
                {/* "+" / attach stub */}
                <button
                    className="mr-3 shrink-0 mb-[3px] w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ 
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--text-primary)"
                    }}
                    disabled={disabled}
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte qualquer coisa"
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent resize-none text-[16px] md:text-[15px] outline-none leading-normal py-1.5"
                    style={{
                        color: "var(--text-primary)",
                        maxHeight: "150px",
                        caretColor: "#26B5B3",
                        minHeight: "24px"
                    }}
                />

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className="ml-3 shrink-0 mb-[1px] w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: value.trim() && !disabled ? "#26B5B3" : "var(--bg-surface)",
                        color: value.trim() && !disabled ? "#000" : "var(--text-muted)",
                        opacity: disabled && value.trim() ? 0.6 : 1,
                    }}
                >
                    {disabled
                        ? (
                            <div
                                className="w-[14px] h-[14px] rounded-sm"
                                style={{ background: "currentColor" }}
                            />
                        )
                        : <ArrowUp size={18} strokeWidth={2.5} />
                    }
                </button>
            </div>

            <p className="text-center text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                Finance Friend pode cometer erros. Confira as informações importantes.
            </p>
        </div>
    );
}

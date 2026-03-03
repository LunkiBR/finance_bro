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
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
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
            {/* Input area */}
            <div
                className="flex items-end gap-2 rounded-[6px] border px-4 py-3"
                style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte qualquer coisa sobre suas finanças..."
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent resize-none text-body outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: "var(--text-primary)", maxHeight: "120px" }}
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className="shrink-0 w-[28px] h-[28px] rounded-[4px] flex items-center justify-center transition-opacity disabled:opacity-20"
                    style={{
                        background: "var(--text-primary)",
                        color: "var(--bg-base)",
                    }}
                >
                    <ArrowUp size={16} />
                </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action}
                        onClick={() => onSend(action)}
                        disabled={disabled}
                        className="shrink-0 px-3 py-[5px] rounded-[6px] border text-caption transition-colors whitespace-nowrap"
                        style={{
                            background: "var(--bg-surface)",
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--bg-surface)";
                        }}
                    >
                        {action}
                    </button>
                ))}
            </div>
        </div>
    );
}

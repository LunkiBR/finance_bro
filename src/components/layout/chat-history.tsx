"use client";

import { MessageSquare, ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";

interface ConversationItem {
    id: string;
    title: string;
    date: string;
}

interface ChatHistoryProps {
    conversations?: ConversationItem[];
    activeId?: string;
    onSelect?: (id: string) => void;
}

export function ChatHistory({ conversations = [], activeId, onSelect }: ChatHistoryProps) {
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <div
                className="w-[48px] shrink-0 border-r flex flex-col items-center pt-3"
                style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                }}
            >
                <button
                    onClick={() => setCollapsed(false)}
                    className="p-2 rounded-[6px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                    <MessageSquare size={16} />
                </button>
            </div>
        );
    }

    // Group conversations by date
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: Record<string, ConversationItem[]> = {};
    conversations.forEach((conv) => {
        const d = new Date(conv.date).toDateString();
        const key = d === today ? "Hoje" : d === yesterday ? "Ontem" : "Anteriores";
        if (!groups[key]) groups[key] = [];
        groups[key].push(conv);
    });

    // Demo data if empty
    const demoGroups = Object.keys(groups).length > 0 ? groups : {
        "Hoje": [
            { id: "1", title: "Resumo de fevereiro", date: "" },
            { id: "2", title: "Gastos com iFood", date: "" },
        ],
        "Ontem": [
            { id: "3", title: "Quanto gastei em transporte", date: "" },
        ],
    };

    return (
        <div
            className="w-[250px] shrink-0 border-r flex flex-col h-full"
            style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-[44px] shrink-0">
                <button
                    onClick={() => setCollapsed(true)}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-2 pb-3">
                {Object.entries(demoGroups).map(([group, items]) => (
                    <div key={group} className="mb-3">
                        <p
                            className="px-2 py-1 text-[11px] uppercase"
                            style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.5px" }}
                        >
                            {group}
                        </p>
                        {items.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelect?.(conv.id)}
                                className="w-full text-left px-2 py-[6px] rounded-[4px] text-[13px] truncate transition-colors"
                                style={{
                                    color: conv.id === activeId ? "var(--text-primary)" : "var(--text-secondary)",
                                    background: conv.id === activeId ? "var(--bg-elevated)" : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (conv.id !== activeId) e.currentTarget.style.background = "var(--bg-elevated)";
                                }}
                                onMouseLeave={(e) => {
                                    if (conv.id !== activeId) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                {conv.title}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

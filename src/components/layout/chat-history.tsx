"use client";

import { MessageSquare, ChevronLeft, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface ConversationItem {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatHistoryProps {
    activeId?: string | null;
    onSelect?: (id: string) => void;
    onNew?: () => void;
}

export function ChatHistory({ activeId, onSelect, onNew }: ChatHistoryProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [conversations, setConversations] = useState<ConversationItem[]>([]);

    useEffect(() => {
        fetch("/api/conversations")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setConversations(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data.map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            updatedAt: c.updated_at ?? c.updatedAt ?? "",
                        }))
                    );
                }
            })
            .catch(() => {/* silently ignore */ });
    }, [activeId]); // refetch whenever active conversation changes (new messages)

    // Group conversations by date
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: Record<string, ConversationItem[]> = {};
    conversations.forEach((conv) => {
        const d = conv.updatedAt ? new Date(conv.updatedAt).toDateString() : "";
        const key = d === today ? "Hoje" : d === yesterday ? "Ontem" : "Anteriores";
        if (!groups[key]) groups[key] = [];
        groups[key].push(conv);
    });

    if (collapsed) {
        return (
            <div
                className="w-[48px] shrink-0 border-r flex flex-col items-center pt-3 gap-2"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
                <button
                    onClick={() => setCollapsed(false)}
                    className="p-2 rounded-[6px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    title="Expandir histórico"
                >
                    <MessageSquare size={16} />
                </button>
                <button
                    onClick={onNew}
                    className="p-2 rounded-[6px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    title="Nova conversa"
                >
                    <Plus size={16} />
                </button>
            </div>
        );
    }

    return (
        <div
            className="w-[250px] shrink-0 border-r flex flex-col h-full"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-[44px] shrink-0">
                <button
                    onClick={() => setCollapsed(true)}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    title="Recolher"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Nova conversa */}
                <button
                    onClick={onNew}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    title="Nova conversa"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-2 pb-3" style={{ scrollbarWidth: "thin" }}>
                {Object.keys(groups).length === 0 ? (
                    <p className="px-2 pt-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                        Nenhuma conversa ainda.
                    </p>
                ) : (
                    Object.entries(groups).map(([group, items]) => (
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
                    ))
                )}
            </div>
        </div>
    );
}

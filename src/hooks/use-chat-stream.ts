"use client";

import { useState, useCallback, useRef } from "react";
import type { ChartSpec } from "@/lib/chart-types";

export interface ChatStreamMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    chartSpecs?: ChartSpec[];
    isStreaming?: boolean;
    errorType?: string;
    retryable?: boolean;
}

export function useChatStream() {
    const [messages, setMessages] = useState<ChatStreamMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Load an existing conversation's messages from DB
    const loadConversation = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/conversations/${id}/messages`);
            if (!res.ok) return;
            const history = await res.json();
            setConversationId(id);
            setMessages(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                history.map((m: any) => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    chartSpecs: (Array.isArray(m.chartSpec) ? m.chartSpec : m.chartSpec ? [m.chartSpec] : []),
                }))
            );
        } catch {
            // silently fail
        }
    }, []);

    // Reset to empty state (new conversation)
    const resetConversation = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setCurrentTool(null);
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        const userMsg: ChatStreamMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content,
        };

        const assistantMsg: ChatStreamMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "",
            chartSpecs: [],
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setIsLoading(true);
        setCurrentTool(null);

        abortRef.current = new AbortController();

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: content,
                    conversationId: conversationId,
                }),
                signal: abortRef.current.signal,
            });

            if (!response.ok || !response.body) throw new Error("Erro no stream");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === "conversation_id") {
                            setConversationId(data.id);
                        } else if (data.type === "tool_use") {
                            setCurrentTool(data.tool);
                        } else if (data.type === "text") {
                            setCurrentTool(null);
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: last.content + data.text,
                                    };
                                }
                                return updated;
                            });
                        } else if (data.type === "chart") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    updated[updated.length - 1] = { ...last, chartSpecs: [...(last.chartSpecs || []), data.spec] };
                                }
                                return updated;
                            });
                        } else if (data.type === "done") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    updated[updated.length - 1] = { ...last, isStreaming: false };
                                }
                                return updated;
                            });
                        } else if (data.type === "error") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    const existingContent = last.content;
                                    const errorMsg = data.message || "Erro ao processar resposta.";
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: existingContent
                                            ? existingContent + "\n\n⚠️ " + errorMsg
                                            : "⚠️ " + errorMsg,
                                        isStreaming: false,
                                        errorType: data.errorType,
                                        retryable: data.retryable,
                                    };
                                }
                                return updated;
                            });
                        }
                    } catch {
                        // skip invalid JSON
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant") {
                        updated[updated.length - 1] = {
                            ...last,
                            content: "⚠️ Erro de conexão. Tente novamente.",
                            isStreaming: false,
                        };
                    }
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
            setCurrentTool(null);
        }
    }, [conversationId]);

    const retryLastMessage = useCallback(() => {
        // Find the last user message and resend it
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;

        // Remove the failed assistant message and the user message
        setMessages((prev) => {
            const idx = prev.findLastIndex((m) => m.role === "user");
            if (idx === -1) return prev;
            return prev.slice(0, idx);
        });

        // Resend after a brief delay
        setTimeout(() => {
            sendMessage(lastUserMsg.content);
        }, 500);
    }, [messages, sendMessage]);

    return {
        messages,
        isLoading,
        currentTool,
        conversationId,
        sendMessage,
        loadConversation,
        resetConversation,
        retryLastMessage,
    };
}

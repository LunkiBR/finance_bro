"use client";

import { useState, useCallback, useRef } from "react";
import type { ChartSpec } from "@/lib/chart-types";

interface ChatStreamMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    chartSpec?: ChartSpec | null;
    isStreaming?: boolean;
}

interface ToolCall {
    tool: string;
}

export function useChatStream() {
    const [messages, setMessages] = useState<ChatStreamMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/chat");
            if (!res.ok) return;
            const history = await res.json();
            setMessages(
                history.map((m: { id: string; role: string; content: string; chartSpec?: ChartSpec }) => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    chartSpec: m.chartSpec || null,
                }))
            );
        } catch {
            // silently fail
        }
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
                body: JSON.stringify({ message: content }),
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

                        if (data.type === "tool_use") {
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
                                    updated[updated.length - 1] = {
                                        ...last,
                                        chartSpec: data.spec,
                                    };
                                }
                                return updated;
                            });
                        } else if (data.type === "done") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        isStreaming: false,
                                    };
                                }
                                return updated;
                            });
                        } else if (data.type === "error") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === "assistant") {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: "⚠️ " + (data.message || "Erro ao processar resposta."),
                                        isStreaming: false,
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
    }, []);

    return {
        messages,
        isLoading,
        currentTool,
        sendMessage,
        loadHistory,
    };
}

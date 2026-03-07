"use client";

import { useEffect, useRef } from "react";
import { ChatHistory } from "@/components/layout/chat-history";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ToolIndicator } from "@/components/chat/tool-indicator";
import { useChatStream } from "@/hooks/use-chat-stream";

export default function CopilotoPage() {
    const {
        messages,
        isLoading,
        currentTool,
        conversationId,
        sendMessage,
        loadConversation,
        resetConversation,
        retryLastMessage,
    } = useChatStream();

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentTool]);

    const isEmpty = messages.length === 0;

    return (
        <div className="flex h-full w-full">
            {/* Chat History - Left sidebar */}
            <ChatHistory
                activeId={conversationId}
                onSelect={loadConversation}
                onNew={resetConversation}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                {isEmpty ? (
                    /* ── Empty state: exactly like ChatGPT ── */
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                        <h1
                            className="text-[28px] font-semibold mb-10 tracking-tight text-center"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Por onde começamos?
                        </h1>
                        <div className="w-full max-w-[760px]">
                            <ChatInput onSend={sendMessage} disabled={isLoading} />
                        </div>
                    </div>
                ) : (
                    /* ── Active chat ── */
                    <>
                        {/* Scrollable messages — full flex column */}
                        <div
                            className="flex-1 overflow-y-auto flex flex-col items-center"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
                        >
                            <div className="w-full max-w-[760px] px-4 pt-10 pb-52">
                                {messages.map((msg) => (
                                    <ChatMessage
                                        key={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        chartSpec={msg.chartSpec}
                                        isStreaming={msg.isStreaming}
                                        retryable={msg.retryable}
                                        onRetry={msg.retryable ? retryLastMessage : undefined}
                                    />
                                ))}
                                {currentTool && <ToolIndicator tool={currentTool} />}
                                <div ref={bottomRef} />
                            </div>
                        </div>

                        {/* Fixed bottom input — gradient fade above it */}
                        <div
                            className="absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-6 pt-10"
                            style={{
                                background: "linear-gradient(to bottom, transparent, var(--bg-base) 50%)",
                                pointerEvents: "none",
                            }}
                        >
                            <div className="w-full max-w-[760px]" style={{ pointerEvents: "auto" }}>
                                <ChatInput onSend={sendMessage} disabled={isLoading} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

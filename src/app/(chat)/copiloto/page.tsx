"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
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

    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentTool]);

    const isEmpty = messages.length === 0;

    return (
        <div className="flex h-full w-full relative">
            {/* Chat History - Left sidebar */}
            <ChatHistory
                activeId={conversationId}
                onSelect={loadConversation}
                onNew={resetConversation}
                mobileOpen={mobileHistoryOpen}
                onCloseMobile={() => setMobileHistoryOpen(false)}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                {/* Mobile History Toggle Icon (Top Left) */}
                <button
                    onClick={() => setMobileHistoryOpen(true)}
                    className="md:hidden absolute z-10 p-2 rounded-full transition-colors flex items-center justify-center"
                    style={{ 
                        top: "calc(16px + env(safe-area-inset-top))",
                        left: "16px",
                        background: "var(--bg-elevated)", 
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}
                >
                    <Menu size={20} strokeWidth={2.5} />
                </button>

                {isEmpty ? (
                    /* ── Empty state ── */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 md:pt-0 pb-6">
                        <div className="w-full max-w-[680px] flex flex-col items-center">
                            <h1
                                className="text-[24px] md:text-[30px] font-semibold mb-6 tracking-tight text-center w-full"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Por onde começamos?
                            </h1>
                            <div className="w-full">
                                <ChatInput onSend={sendMessage} disabled={isLoading} />
                            </div>
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
                                        chartSpecs={msg.chartSpecs}
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
                            className="absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-6 md:pb-6 pt-10"
                            style={{
                                background: "linear-gradient(to bottom, transparent, var(--bg-base) 60%)",
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

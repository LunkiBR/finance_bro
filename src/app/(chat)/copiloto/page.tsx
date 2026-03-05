"use client";

import { useEffect, useRef } from "react";
import { ChatHistory } from "@/components/layout/chat-history";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatSuggestions } from "@/components/chat/chat-suggestions";
import { ToolIndicator } from "@/components/chat/tool-indicator";
import { useChatStream } from "@/hooks/use-chat-stream";

export default function CopilotoPage() {
    const { messages, isLoading, currentTool, sendMessage, loadHistory } = useChatStream();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, currentTool]);

    const isEmpty = messages.length === 0;

    return (
        <div className="flex h-full w-full relative">
            {/* Chat History Panel - Left sidebar inside Copiloto */}
            <ChatHistory />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {isEmpty ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col justify-center items-center p-6">
                        <div className="max-w-[720px] w-full mt-auto mb-8">
                            <ChatSuggestions onSelect={sendMessage} userName="Leo" />
                        </div>
                    </div>
                ) : (
                    /* Chat with messages */
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-8 pb-32 scroll-smooth"
                    >
                        <div className="max-w-[720px] mx-auto min-h-full flex flex-col justify-end">
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    chartSpec={msg.chartSpec}
                                    isStreaming={msg.isStreaming}
                                />
                            ))}
                            {currentTool && <ToolIndicator tool={currentTool} />}
                        </div>
                    </div>
                )}

                {/* Fixed Input Area at bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 pt-4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent pointer-events-none">
                    <div className="max-w-[720px] mx-auto pointer-events-auto">
                        <ChatInput onSend={sendMessage} disabled={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
}

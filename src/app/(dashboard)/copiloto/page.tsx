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
        <div
            className="flex h-full"
        >
            {/* Chat History Panel */}
            <ChatHistory />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {isEmpty ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col">
                        <ChatSuggestions onSelect={sendMessage} userName="Leo" />
                        <div className="px-6 pb-6 max-w-[720px] mx-auto w-full">
                            <ChatInput onSend={sendMessage} disabled={isLoading} />
                        </div>
                    </div>
                ) : (
                    /* Chat with messages */
                    <>
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-6 pt-6"
                        >
                            <div className="max-w-[720px] mx-auto">
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
                        <div className="px-6 pb-6 pt-2 max-w-[720px] mx-auto w-full">
                            <ChatInput onSend={sendMessage} disabled={isLoading} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

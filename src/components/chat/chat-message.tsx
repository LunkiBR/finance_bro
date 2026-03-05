"use client";

import type { ChartSpec } from "@/lib/chart-types";
import { InlineChart } from "@/components/charts/inline-chart";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    chartSpec?: ChartSpec | null;
    isStreaming?: boolean;
}

export function ChatMessage({ role, content, chartSpec, isStreaming }: ChatMessageProps) {
    if (role === "user") {
        return (
            <div className="flex justify-end mb-6">
                <div
                    className="max-w-[85%] px-5 py-3 rounded-[20px] rounded-br-[4px] text-[15px] leading-relaxed"
                    style={{ background: "var(--accent-blue)", color: "#ffffff" }}
                >
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-6 group">
            <div className="flex gap-4 max-w-[85%]">
                {/* Assistant Icon */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a2 2 0 0 1 2 2c-.001.554-.26 1.071-.707 1.4A4 4 0 0 0 12 13a4 4 0 0 0-1.293-7.6A2 2 0 0 1 12 2z" />
                        <path d="M19 13v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1" />
                        <path d="M12 13v8" />
                        <path d="m9 17 3-4 3 4" />
                        <path d="M12 21h0" />
                    </svg>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 pt-1">
                    <div
                        className="prose-ff text-[15px] leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    />
                    {isStreaming && (
                        <span
                            className="inline-block w-[6px] h-[16px] ml-1 animate-pulse"
                            style={{ background: "var(--text-muted)" }}
                        />
                    )}
                    {chartSpec && (
                        <div className="mt-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                            <div className="p-4" style={{ background: 'var(--bg-elevated)' }}>
                                <InlineChart spec={chartSpec} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple markdown-to-HTML renderer
function renderMarkdown(text: string): string {
    if (!text) return "";

    let html = text
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-h3 mt-4 mb-2" style="color:var(--text-primary)">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-h2 mt-4 mb-2" style="color:var(--text-primary)">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-h1 mt-4 mb-2" style="color:var(--text-primary)">$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:590;color:var(--text-primary)">$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`([^`]+)`/g, '<code style="background:var(--bg-elevated);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:13px">$1</code>')
        // Blockquotes
        .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:2px solid var(--border-strong);padding-left:12px;color:var(--text-secondary);margin:8px 0">$1</blockquote>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc;margin-bottom:4px">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal;margin-bottom:4px">$1</li>')
        // Line breaks
        .replace(/\n\n/g, "<br/><br/>")
        .replace(/\n/g, "<br/>");

    // Tables
    html = html.replace(
        /(\|.+\|<br\/>)+/g,
        (match) => {
            const rows = match.split("<br/>").filter((r) => r.trim());
            if (rows.length < 2) return match;

            let tableHtml = '<div style="overflow-x:auto;margin:12px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">';

            rows.forEach((row, i) => {
                if (row.includes("---")) return; // Skip separator row
                const cells = row.split("|").filter((c) => c.trim());
                const tag = i === 0 ? "th" : "td";
                tableHtml += "<tr>";
                cells.forEach((cell) => {
                    const style = i === 0
                        ? 'style="text-align:left;padding:8px 12px;border-bottom:1px solid var(--border-strong);color:var(--text-secondary);font-weight:500"'
                        : 'style="text-align:left;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text-primary)"';
                    tableHtml += `<${tag} ${style}>${cell.trim()}</${tag}>`;
                });
                tableHtml += "</tr>";
            });

            tableHtml += "</table></div>";
            return tableHtml;
        }
    );

    return html;
}

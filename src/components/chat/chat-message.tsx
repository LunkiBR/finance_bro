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
                    className="max-w-[85%] text-body"
                    style={{ color: "var(--text-primary)" }}
                >
                    {content}
                    <div
                        className="mt-2 h-[1px]"
                        style={{ background: "var(--border)" }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="max-w-[85%]">
                <div
                    className="prose-ff text-body"
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
                    <div className="mt-4">
                        <InlineChart spec={chartSpec} />
                    </div>
                )}
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

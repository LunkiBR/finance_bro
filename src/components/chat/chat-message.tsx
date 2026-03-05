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
        // Exactly like ChatGPT: blue rounded pill, flush right
        return (
            <div className="flex justify-end mb-6">
                <div
                    className="max-w-[85%] px-5 py-3 text-[15px] leading-relaxed"
                    style={{
                        background: "#2f6feb",
                        color: "#fff",
                        borderRadius: "20px 20px 4px 20px",
                    }}
                >
                    {content}
                </div>
            </div>
        );
    }

    // Assistant: plain left-aligned text exactly like ChatGPT (no bubble, no avatar circle)
    return (
        <div className="mb-8">
            <div
                className="prose-ff text-[15px] leading-[1.8]"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
            {isStreaming && (
                <span
                    className="inline-block w-[2px] h-[18px] ml-[2px] align-middle animate-pulse"
                    style={{ background: "var(--text-primary)", borderRadius: "2px" }}
                />
            )}
            {chartSpec && (
                <div className="mt-4 rounded-[12px] overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                    <div className="p-4" style={{ background: "var(--bg-elevated)" }}>
                        <InlineChart spec={chartSpec} />
                    </div>
                </div>
            )}
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
        .replace(/^### (.+)$/gm, '<h3 class="text-[16px] font-semibold mt-5 mb-2" style="color:var(--text-primary)">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-[18px] font-semibold mt-6 mb-2" style="color:var(--text-primary)">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-[20px] font-semibold mt-6 mb-3" style="color:var(--text-primary)">$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`([^`]+)`/g, '<code style="background:var(--bg-elevated);padding:2px 6px;border-radius:5px;font-family:var(--font-mono);font-size:13px;color:var(--text-primary)">$1</code>')
        // Blockquotes
        .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--border-strong);padding-left:14px;color:var(--text-secondary);margin:10px 0;font-style:italic">$1</blockquote>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li style="margin-left:18px;list-style:disc;padding-left:4px;margin-bottom:6px;color:var(--text-primary)">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:18px;list-style:decimal;padding-left:4px;margin-bottom:6px;color:var(--text-primary)">$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0" />')
        // Line breaks
        .replace(/\n\n/g, "<br/><br/>")
        .replace(/\n/g, "<br/>");

    // Tables
    html = html.replace(
        /(\|.+\|<br\/>)+/g,
        (match) => {
            const rows = match.split("<br/>").filter((r) => r.trim());
            if (rows.length < 2) return match;

            let tableHtml = '<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse;font-size:14px">';

            rows.forEach((row, i) => {
                if (row.includes("---")) return;
                const cells = row.split("|").filter((c) => c.trim());
                const tag = i === 0 ? "th" : "td";
                tableHtml += "<tr>";
                cells.forEach((cell) => {
                    const style = i === 0
                        ? 'style="text-align:left;padding:10px 14px;border-bottom:1px solid var(--border-strong);color:var(--text-secondary);font-weight:500;font-size:13px"'
                        : 'style="text-align:left;padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-primary)"';
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

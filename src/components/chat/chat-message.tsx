"use client";

import type { ChartSpec } from "@/lib/chart-types";
import { InlineChart } from "@/components/charts/inline-chart";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    chartSpecs?: ChartSpec[];
    isStreaming?: boolean;
    retryable?: boolean;
    onRetry?: () => void;
}

export function ChatMessage({ role, content, chartSpecs, isStreaming, retryable, onRetry }: ChatMessageProps) {
    if (role === "user") {
        // ChatGPT user bubble: blue, right-aligned, ~12px radius, tighter padding
        return (
            <div className="flex justify-end mb-4">
                <div
                    className="max-w-[80%] px-4 py-[10px] text-[15px] leading-[1.6]"
                    style={{
                        background: "#2f6feb",
                        color: "#fff",
                        borderRadius: "18px 18px 4px 18px",
                        wordBreak: "break-word",
                    }}
                >
                    {content}
                </div>
            </div>
        );
    }

    // Assistant: plain left-aligned, no bubble, ChatGPT-exact markdown rendering
    return (
        <div className="mb-8 group">
            <div
                className="text-[15px] leading-[1.75]"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
            {isStreaming && (
                <span
                    className="inline-block w-[2px] h-[18px] ml-[2px] align-middle animate-pulse"
                    style={{ background: "var(--text-primary)", borderRadius: "1px" }}
                />
            )}
            {chartSpecs && chartSpecs.length > 0 && chartSpecs.map((spec, i) => (
                <div
                    key={i}
                    className="mt-4 rounded-[10px] overflow-hidden border"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="p-4" style={{ background: "var(--bg-elevated)" }}>
                        <InlineChart spec={spec} />
                    </div>
                </div>
            ))}
            {/* Retry button for retryable errors */}
            {!isStreaming && retryable && onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-3 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                    style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                >
                    Tentar novamente
                </button>
            )}
            {/* Action row — hidden until hover, like ChatGPT */}
            {!isStreaming && content && !retryable && (
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => navigator.clipboard.writeText(content)}
                        className="p-1.5 rounded-[4px] text-[11px] transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        title="Copiar"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

// ChatGPT-faithful markdown-to-HTML renderer
function renderMarkdown(text: string): string {
    if (!text) return "";

    // Escape HTML first
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Code blocks (```) — must come before inline code
    html = html.replace(
        /```(\w*)\n?([\s\S]*?)```/g,
        (_, lang, code) =>
            `<pre style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:12px 0;font-size:13px;line-height:1.6"><code style="color:var(--text-primary);font-family:var(--font-mono)">${code.trim()}</code></pre>`
    );

    // Headers
    html = html
        .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:20px 0 8px;color:var(--text-primary)">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 style="font-size:19px;font-weight:600;margin:24px 0 10px;color:var(--text-primary)">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:600;margin:28px 0 12px;color:var(--text-primary)">$1</h1>');

    // Bold + Italic combinations
    html = html
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
        .replace(/_(.+?)_/g, '<em style="font-style:italic">$1</em>');

    // Inline code
    html = html.replace(
        /`([^`]+)`/g,
        '<code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:13px;color:var(--text-primary)">$1</code>'
    );

    // Blockquote
    html = html.replace(
        /^(?:&gt;|>) (.+)$/gm,
        '<blockquote style="border-left:3px solid var(--border-strong);padding-left:14px;color:var(--text-secondary);margin:12px 0;font-style:italic">$1</blockquote>'
    );

    // Horizontal rule (---)
    html = html.replace(
        /^---$/gm,
        '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0" />'
    );

    // Unordered lists — convert consecutive lines
    html = html.replace(
        /(^- .+$(\n^- .+$)*)/gm,
        (match) => {
            const items = match
                .split("\n")
                .map((line) => line.replace(/^- /, "").trim())
                .map((item) => `<li style="padding-left:4px;margin-bottom:4px">${item}</li>`)
                .join("");
            return `<ul style="margin:10px 0 10px 24px;list-style:disc;color:var(--text-primary)">${items}</ul>`;
        }
    );

    // Ordered lists
    html = html.replace(
        /(^\d+\. .+$(\n^\d+\. .+$)*)/gm,
        (match) => {
            const items = match
                .split("\n")
                .map((line) => line.replace(/^\d+\. /, "").trim())
                .map((item) => `<li style="padding-left:4px;margin-bottom:4px">${item}</li>`)
                .join("");
            return `<ol style="margin:10px 0 10px 24px;list-style:decimal;color:var(--text-primary)">${items}</ol>`;
        }
    );

    // Tables
    html = html.replace(
        /(\|.+\|\n)+/g,
        (match) => {
            const rows = match.trim().split("\n").filter((r) => r.trim());
            if (rows.length < 2) return match;

            let tableHtml = '<div style="overflow-x:auto;margin:14px 0"><table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid var(--border);border-radius:6px;overflow:hidden">';

            rows.forEach((row, i) => {
                if (/^\|[-:|\s]+\|$/.test(row)) return; // separator row
                const cells = row.split("|").filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
                const tag = i === 0 ? "th" : "td";
                const bg = i === 0 ? "background:var(--bg-elevated);" : (i % 2 === 0 ? "background:var(--bg-base);" : "");
                tableHtml += "<tr>";
                cells.forEach((cell) => {
                    const border = "border:1px solid var(--border);";
                    const weight = i === 0 ? "font-weight:600;" : "";
                    const color = "color:var(--text-primary);";
                    tableHtml += `<${tag} style="text-align:left;padding:9px 14px;${border}${bg}${weight}${color}">${cell.trim()}</${tag}>`;
                });
                tableHtml += "</tr>";
            });

            tableHtml += "</table></div>";
            return tableHtml;
        }
    );

    // Paragraphs — double newlines become paragraph breaks
    html = html.replace(/\n\n+/g, '<br/><br/>').replace(/\n/g, "<br/>");

    return html;
}

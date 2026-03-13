"use client";

import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";

export interface RuleToastData {
  txId: string;
  description: string;
  beneficiary: string;
  newCategory: string;
  newSubcategory?: string | null;
}

interface RuleToastProps {
  data: RuleToastData;
  onCreateRule: (
    matchType: "exact" | "contains",
    matchString: string,
    category: string,
    subcategory?: string | null
  ) => void;
  onDismiss: () => void;
}

export function RuleToast({ data, onCreateRule, onDismiss }: RuleToastProps) {
  const [containsInput, setContainsInput] = useState("");
  const [showContainsInput, setShowContainsInput] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
    const timer = setTimeout(onDismiss, 15000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Extract meaningful keyword from description for "contains" suggestion
  const suggestedKeyword = extractKeyword(data.description);

  function handleExact() {
    onCreateRule("exact", data.description, data.newCategory, data.newSubcategory);
  }

  function handleContains() {
    if (showContainsInput) {
      if (containsInput.trim()) {
        onCreateRule("contains", containsInput.trim(), data.newCategory, data.newSubcategory);
      }
    } else {
      setContainsInput(suggestedKeyword);
      setShowContainsInput(true);
    }
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] max-w-[420px] rounded-[10px] border shadow-2xl transition-all duration-300"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-[6px] shrink-0 mt-0.5"
          style={{ background: "rgba(99, 102, 241, 0.12)" }}
        >
          <Zap size={16} style={{ color: "#818CF8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-[1.5]" style={{ color: "var(--text-primary)" }}>
            Categoria alterada para <strong>{data.newCategory}</strong>
            {data.newSubcategory && <> &rsaquo; {data.newSubcategory}</>}.
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
            Criar regra para categorizar automaticamente?
          </p>

          {showContainsInput && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                Contém:
              </span>
              <input
                autoFocus
                value={containsInput}
                onChange={(e) => setContainsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleContains(); }}
                className="flex-1 px-2 py-1 rounded-[4px] border text-[12px]"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleExact}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors"
              style={{
                background: "rgba(99, 102, 241, 0.12)",
                color: "#818CF8",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)"; }}
            >
              Exato
            </button>
            <button
              onClick={handleContains}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
            >
              {showContainsInput ? "Salvar" : "Contém..."}
            </button>
            <button
              onClick={onDismiss}
              className="text-[12px] ml-auto transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              Não
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 mt-0.5 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function extractKeyword(description: string): string {
  // Remove common prefixes like "Compra aprovada em", "PIX recebido de", etc.
  const cleaned = description
    .replace(/^(compra\s+(no\s+)?d[eé]bito\s+)/i, "")
    .replace(/^(pag(?:to|amento)\s+(?:no\s+)?d[eé]bito\s+)/i, "")
    .replace(/^(pix\s+(?:recebido|enviado)\s+(?:de|para)\s+)/i, "")
    .replace(/^(compra\s+aprovada\s+em\s+)/i, "")
    .replace(/^(pagamento\s+de?\s+)/i, "")
    .replace(/\s+\d{2}\/\d{2}.*$/, "") // Remove date suffixes
    .replace(/\s+\d+x\s*de\s*R?\$.*$/i, "") // Remove installment info
    .trim();

  // Take first 2-3 meaningful words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
  return words.join(" ").toLowerCase();
}

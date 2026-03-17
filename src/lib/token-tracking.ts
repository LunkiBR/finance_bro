import { db } from "@/db";
import { tokenUsage } from "@/db/schema";

// ─── Pricing (USD per 1M tokens) ─────────────────────────────────────────────
// Gemini 2.5 Flash: $0.15 input, $0.60 output (used by chat + identify_payee)
// GPT-4o-mini:      $0.15 input, $0.60 output (used by n8n categorization — tracked in n8n directly)
const INPUT_PRICE_PER_1M = 0.15;
const OUTPUT_PRICE_PER_1M = 0.60;

// ─── Exchange rate ───────────────────────────────────────────────────────────
export const USD_TO_BRL = 5.70;

// ─── Cost calculation ────────────────────────────────────────────────────────

export function calculateCostUsd(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

export function usdToBrl(usd: number): number {
  return Math.round(usd * USD_TO_BRL * 100) / 100;
}

// ─── Token accumulator (for multi-iteration chat loop) ───────────────────────

export class TokenAccumulator {
  inputTokens = 0;
  outputTokens = 0;
  totalTokens = 0;

  add(usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined) {
    if (!usage) return;
    this.inputTokens += usage.promptTokenCount ?? 0;
    this.outputTokens += usage.candidatesTokenCount ?? 0;
    this.totalTokens += usage.totalTokenCount ?? 0;
  }
}

// ─── Log to database (fire-and-forget) ───────────────────────────────────────

export function logTokenUsage(params: {
  userId: string;
  source: "chat" | "identify_payee";
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  conversationId?: string;
}) {
  const costUsd = calculateCostUsd(params.inputTokens, params.outputTokens);

  // Fire-and-forget — don't block the response
  db.insert(tokenUsage)
    .values({
      userId: params.userId,
      source: params.source,
      model: "gemini-2.5-flash",
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens: params.totalTokens,
      costUsd: costUsd.toString(),
      conversationId: params.conversationId ?? null,
    })
    .then(() => {})
    .catch((err) => console.error("Token usage log error:", err));
}

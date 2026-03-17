import { db } from "@/db";
import { tokenUsage } from "@/db/schema";

// ─── Pricing (USD per 1M tokens) ─────────────────────────────────────────────
// Gemini 2.5 Flash: used for chat + identify_payee (copiloto)
const GEMINI_FLASH_INPUT  = 0.15;   // $0.15 / 1M input tokens
const GEMINI_FLASH_OUTPUT = 3.50;   // $3.50 / 1M output tokens

// GPT-4o-mini: used for n8n_categorize (categorização via n8n)
const GPT4O_MINI_INPUT  = 0.150;    // $0.150 / 1M input tokens
const GPT4O_MINI_OUTPUT = 0.600;    // $0.600 / 1M output tokens

// ─── Exchange rate ───────────────────────────────────────────────────────────
export const USD_TO_BRL = 5.70;

// ─── Cost calculation (source-aware) ─────────────────────────────────────────

export function calculateCostUsd(
  inputTokens: number,
  outputTokens: number,
  source: "chat" | "identify_payee" | "n8n_categorize" = "chat"
): number {
  const isGemini = source === "chat" || source === "identify_payee";
  const inputPrice  = isGemini ? GEMINI_FLASH_INPUT  : GPT4O_MINI_INPUT;
  const outputPrice = isGemini ? GEMINI_FLASH_OUTPUT : GPT4O_MINI_OUTPUT;

  const inputCost  = (inputTokens  / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
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
  const costUsd = calculateCostUsd(params.inputTokens, params.outputTokens, params.source);

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

import { NextRequest } from "next/server";
import { db } from "@/db";
import { tokenUsage, users } from "@/db/schema";
import { eq, sql, and, gte, lt, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { USD_TO_BRL } from "@/lib/token-tracking";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { role } = authResult;
  if (role !== "admin")
    return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period"); // "2026-03" or null (current month)

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Per-user aggregation
  const perUser = await db
    .select({
      userId: tokenUsage.userId,
      userName: users.name,
      username: users.username,
      inputTokens: sql<number>`COALESCE(SUM(${tokenUsage.inputTokens}), 0)::int`.as("input_tokens_sum"),
      outputTokens: sql<number>`COALESCE(SUM(${tokenUsage.outputTokens}), 0)::int`.as("output_tokens_sum"),
      totalTokens: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)::int`.as("total_tokens_sum"),
      costUsd: sql<string>`COALESCE(SUM(${tokenUsage.costUsd}::numeric), 0)::text`.as("cost_usd_sum"),
      callCount: sql<number>`COUNT(*)::int`.as("call_count"),
    })
    .from(tokenUsage)
    .innerJoin(users, eq(tokenUsage.userId, users.id))
    .where(and(gte(tokenUsage.createdAt, startDate), lt(tokenUsage.createdAt, endDate)))
    .groupBy(tokenUsage.userId, users.name, users.username);

  // Grand total
  const totalInputTokens = perUser.reduce((s, u) => s + u.inputTokens, 0);
  const totalOutputTokens = perUser.reduce((s, u) => s + u.outputTokens, 0);
  const totalTokens = perUser.reduce((s, u) => s + u.totalTokens, 0);
  const totalCostUsd = perUser.reduce((s, u) => s + parseFloat(u.costUsd), 0);
  const totalCalls = perUser.reduce((s, u) => s + u.callCount, 0);

  // Recent calls (last 20)
  const recentCalls = await db
    .select({
      id: tokenUsage.id,
      userId: tokenUsage.userId,
      userName: users.name,
      source: tokenUsage.source,
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens,
      totalTokens: tokenUsage.totalTokens,
      costUsd: tokenUsage.costUsd,
      createdAt: tokenUsage.createdAt,
    })
    .from(tokenUsage)
    .innerJoin(users, eq(tokenUsage.userId, users.id))
    .orderBy(desc(tokenUsage.createdAt))
    .limit(20);

  return Response.json({
    period: period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    usdToBrl: USD_TO_BRL,
    perUser: perUser.map((u) => ({
      ...u,
      costBrl: (parseFloat(u.costUsd) * USD_TO_BRL).toFixed(2),
    })),
    grandTotal: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens,
      costUsd: totalCostUsd.toFixed(6),
      costBrl: (totalCostUsd * USD_TO_BRL).toFixed(2),
      callCount: totalCalls,
    },
    recentCalls: recentCalls.map((c) => ({
      ...c,
      costBrl: (parseFloat(c.costUsd) * USD_TO_BRL).toFixed(4),
    })),
  });
}

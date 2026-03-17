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
  const period = searchParams.get("period");

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

  const isCurrentMonth =
    startDate.getFullYear() === now.getFullYear() &&
    startDate.getMonth() === now.getMonth();

  // ── Per-user aggregation ──────────────────────────────────────────────────
  const perUser = await db
    .select({
      userId: tokenUsage.userId,
      userName: users.name,
      username: users.username,
      inputTokens: sql<number>`COALESCE(SUM(${tokenUsage.inputTokens}), 0)::int`,
      outputTokens: sql<number>`COALESCE(SUM(${tokenUsage.outputTokens}), 0)::int`,
      totalTokens: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)::int`,
      costUsd: sql<string>`COALESCE(SUM(${tokenUsage.costUsd}::numeric), 0)::text`,
      callCount: sql<number>`COUNT(*)::int`,
    })
    .from(tokenUsage)
    .innerJoin(users, eq(tokenUsage.userId, users.id))
    .where(and(gte(tokenUsage.createdAt, startDate), lt(tokenUsage.createdAt, endDate)))
    .groupBy(tokenUsage.userId, users.name, users.username)
    .orderBy(sql`SUM(${tokenUsage.costUsd}::numeric) DESC`);

  // ── Source breakdown per user ─────────────────────────────────────────────
  const sourceBreakdown = await db
    .select({
      userId: tokenUsage.userId,
      source: tokenUsage.source,
      totalTokens: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)::int`,
      callCount: sql<number>`COUNT(*)::int`,
    })
    .from(tokenUsage)
    .where(and(gte(tokenUsage.createdAt, startDate), lt(tokenUsage.createdAt, endDate)))
    .groupBy(tokenUsage.userId, tokenUsage.source);

  // Group source breakdown by userId
  const sourceByUser: Record<string, Record<string, { tokens: number; calls: number }>> = {};
  for (const row of sourceBreakdown) {
    if (!sourceByUser[row.userId]) sourceByUser[row.userId] = {};
    sourceByUser[row.userId][row.source] = { tokens: row.totalTokens, calls: row.callCount };
  }

  // ── Daily breakdown for chart ─────────────────────────────────────────────
  const dailyRows = await db
    .select({
      day: sql<string>`DATE(${tokenUsage.createdAt})::text`,
      totalTokens: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)::int`,
      costUsd: sql<string>`COALESCE(SUM(${tokenUsage.costUsd}::numeric), 0)::text`,
      callCount: sql<number>`COUNT(*)::int`,
    })
    .from(tokenUsage)
    .where(and(gte(tokenUsage.createdAt, startDate), lt(tokenUsage.createdAt, endDate)))
    .groupBy(sql`DATE(${tokenUsage.createdAt})`)
    .orderBy(sql`DATE(${tokenUsage.createdAt})`);

  // Fill missing days with zeros
  const daysInPeriod: { day: string; tokens: number; costUsd: number; costBrl: number; calls: number }[] = [];
  const daysInMonth = isCurrentMonth
    ? now.getDate()
    : new Date(endDate.getTime() - 1).getDate();
  const dayMap = new Map(dailyRows.map((r) => [r.day, r]));

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const row = dayMap.get(dayStr);
    const costUsd = row ? parseFloat(row.costUsd) : 0;
    daysInPeriod.push({
      day: dayStr,
      tokens: row?.totalTokens ?? 0,
      costUsd,
      costBrl: Math.round(costUsd * USD_TO_BRL * 10000) / 10000,
      calls: row?.callCount ?? 0,
    });
  }

  // ── Grand totals ──────────────────────────────────────────────────────────
  const totalInputTokens = perUser.reduce((s, u) => s + u.inputTokens, 0);
  const totalOutputTokens = perUser.reduce((s, u) => s + u.outputTokens, 0);
  const totalTokens = perUser.reduce((s, u) => s + u.totalTokens, 0);
  const totalCostUsd = perUser.reduce((s, u) => s + parseFloat(u.costUsd), 0);
  const totalCalls = perUser.reduce((s, u) => s + u.callCount, 0);
  const activeUsers = perUser.length;

  // ── SaaS pricing metrics ──────────────────────────────────────────────────
  const avgCostPerUserUsd = activeUsers > 0 ? totalCostUsd / activeUsers : 0;
  const avgCostPerCallUsd = totalCalls > 0 ? totalCostUsd / totalCalls : 0;
  const avgTokensPerCall = totalCalls > 0 ? totalTokens / totalCalls : 0;

  // Projected full-month cost (linear extrapolation from days elapsed)
  let projectedCostUsd = totalCostUsd;
  if (isCurrentMonth) {
    const daysElapsed = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    projectedCostUsd = daysElapsed > 0 ? (totalCostUsd / daysElapsed) * totalDaysInMonth : 0;
  }

  // Recent calls (last 30)
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
    .where(and(gte(tokenUsage.createdAt, startDate), lt(tokenUsage.createdAt, endDate)))
    .orderBy(desc(tokenUsage.createdAt))
    .limit(30);

  return Response.json({
    period: period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    usdToBrl: USD_TO_BRL,
    isCurrentMonth,
    grandTotal: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens,
      costUsd: totalCostUsd.toFixed(6),
      costBrl: (totalCostUsd * USD_TO_BRL).toFixed(2),
      callCount: totalCalls,
      activeUsers,
    },
    saasMetrics: {
      avgCostPerUserUsd: avgCostPerUserUsd.toFixed(6),
      avgCostPerUserBrl: (avgCostPerUserUsd * USD_TO_BRL).toFixed(4),
      avgCostPerCallUsd: avgCostPerCallUsd.toFixed(6),
      avgCostPerCallBrl: (avgCostPerCallUsd * USD_TO_BRL).toFixed(4),
      avgTokensPerCall: Math.round(avgTokensPerCall),
      projectedCostUsd: projectedCostUsd.toFixed(4),
      projectedCostBrl: (projectedCostUsd * USD_TO_BRL).toFixed(2),
    },
    perUser: perUser.map((u) => ({
      ...u,
      costBrl: (parseFloat(u.costUsd) * USD_TO_BRL).toFixed(2),
      avgTokensPerCall: u.callCount > 0 ? Math.round(u.totalTokens / u.callCount) : 0,
      sources: sourceByUser[u.userId] ?? {},
    })),
    dailyBreakdown: daysInPeriod,
    recentCalls: recentCalls.map((c) => ({
      ...c,
      costBrl: (parseFloat(c.costUsd) * USD_TO_BRL).toFixed(4),
    })),
  });
}

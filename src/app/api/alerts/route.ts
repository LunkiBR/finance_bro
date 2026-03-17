import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, budgets, goals } from "@/db/schema";
import { isNull, eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encrypt, safeDecrypt, safeDecryptNumber } from "@/lib/encryption";

// GET /api/alerts — retorna alertas ativos (não dispensados)
export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, userId), isNull(alerts.dismissedAt)))
    .orderBy(alerts.createdAt);

  const decrypted = activeAlerts.map(a => ({ ...a, message: safeDecrypt(a.message) }));
  return NextResponse.json(decrypted);
}

// PATCH /api/alerts — dispensar um alerta
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const { id } = await req.json() as { id: string };

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  }

  await db
    .update(alerts)
    .set({ dismissedAt: new Date() })
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)));

  return NextResponse.json({ success: true });
}

// POST /api/alerts — criar alerta (n8n ou trigger interno)
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.ALERTS_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get("x-webhook-secret");

    let userId: string;
    if (webhookSecret && incomingSecret === webhookSecret) {
      const body = await req.json() as {
        type: "budget_80pct" | "budget_exceeded" | "goal_reminder";
        category: string;
        message: string;
        userId: string;
      };
      userId = body.userId;
      if (!userId) {
        return NextResponse.json({ error: "userId obrigatório no body." }, { status: 400 });
      }

      const existing = await db.select().from(alerts)
        .where(and(
          eq(alerts.userId, userId),
          sql`${alerts.type} = ${body.type} AND ${alerts.category} = ${body.category} AND ${alerts.dismissedAt} IS NULL`
        ))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ skipped: true, reason: "Alert already active." });
      }

      const [alert] = await db.insert(alerts).values({ userId, type: body.type, category: body.category, message: encrypt(body.message) }).returning();
      return NextResponse.json({ ...alert, message: body.message }, { status: 201 });
    }

    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    userId = authResult.userId;

    const body = await req.json() as {
      type: "budget_80pct" | "budget_exceeded" | "goal_reminder";
      category: string;
      message: string;
    };

    const existing = await db.select().from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        sql`${alerts.type} = ${body.type} AND ${alerts.category} = ${body.category} AND ${alerts.dismissedAt} IS NULL`
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Alert already active." });
    }

    const [alert] = await db.insert(alerts).values({ userId, type: body.type, category: body.category, message: encrypt(body.message) }).returning();
    return NextResponse.json({ ...alert, message: body.message }, { status: 201 });
  } catch (err) {
    console.error("Alerts POST error:", err);
    return NextResponse.json({ error: "Erro ao criar alerta." }, { status: 500 });
  }
}

// PUT /api/alerts — verificar condições e criar alertas automaticamente
export async function PUT(req: NextRequest) {
  try {
    const webhookSecret = process.env.ALERTS_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get("x-webhook-secret");

    let userId: string;
    if (webhookSecret && incomingSecret === webhookSecret) {
      const body = await req.json() as { userId: string };
      userId = body.userId;
      if (!userId) {
        return NextResponse.json({ error: "userId obrigatório no body." }, { status: 400 });
      }
    } else {
      const authResult = await requireAuth();
      if (authResult instanceof Response) return authResult;
      userId = authResult.userId;
    }

    const results: string[] = [];

    const budgetRows = await db.select().from(budgets).where(eq(budgets.userId, userId));
    for (const b of budgetRows) {
      const spent = safeDecryptNumber(b.spentAmount);
      const limit = safeDecryptNumber(b.limitAmount);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;

      if (pct >= 100) {
        const existing = await db.select().from(alerts)
          .where(and(eq(alerts.userId, userId), sql`${alerts.type} = 'budget_exceeded' AND ${alerts.category} = ${b.category} AND ${alerts.dismissedAt} IS NULL`))
          .limit(1);
        if (existing.length === 0) {
          const msg = `Orçamento de ${b.category} estourado: R$ ${spent.toFixed(2)} / R$ ${limit.toFixed(2)} (${Math.round(pct)}%)`;
          await db.insert(alerts).values({
            userId,
            type: "budget_exceeded",
            category: b.category,
            message: encrypt(msg),
          });
          results.push(`budget_exceeded: ${b.category}`);
        }
      } else if (pct >= 80) {
        const existing = await db.select().from(alerts)
          .where(and(eq(alerts.userId, userId), sql`${alerts.type} = 'budget_80pct' AND ${alerts.category} = ${b.category} AND ${alerts.dismissedAt} IS NULL`))
          .limit(1);
        if (existing.length === 0) {
          const msg = `Orçamento de ${b.category} em ${Math.round(pct)}%: R$ ${spent.toFixed(2)} / R$ ${limit.toFixed(2)}`;
          await db.insert(alerts).values({
            userId,
            type: "budget_80pct",
            category: b.category,
            message: encrypt(msg),
          });
          results.push(`budget_80pct: ${b.category}`);
        }
      }
    }

    const goalRows = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active")));
    for (const g of goalRows) {
      const current = safeDecryptNumber(g.currentAmount);
      const target = safeDecryptNumber(g.targetAmount);
      const name = safeDecrypt(g.name);
      const pct = target > 0 ? (current / target) * 100 : 0;
      if (pct < 100 && g.deadline) {
        const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
        if (daysLeft > 0 && daysLeft <= 30) {
          const existing = await db.select().from(alerts)
            .where(and(eq(alerts.userId, userId), sql`${alerts.type} = 'goal_reminder' AND ${alerts.category} = ${name} AND ${alerts.dismissedAt} IS NULL`))
            .limit(1);
          if (existing.length === 0) {
            const msg = `Meta "${name}" está em ${Math.round(pct)}% e vence em ${daysLeft} dias.`;
            await db.insert(alerts).values({
              userId,
              type: "goal_reminder",
              category: name,
              message: encrypt(msg),
            });
            results.push(`goal_reminder: ${name}`);
          }
        }
      }
    }

    return NextResponse.json({ checked: true, alertsCreated: results.length, details: results });
  } catch (err) {
    console.error("Alerts PUT error:", err);
    return NextResponse.json({ error: "Erro ao verificar condições." }, { status: 500 });
  }
}

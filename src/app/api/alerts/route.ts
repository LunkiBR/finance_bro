import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, budgets, goals } from "@/db/schema";
import { isNull, eq, sql } from "drizzle-orm";

// GET /api/alerts — retorna alertas ativos (não dispensados)
export async function GET() {
  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(isNull(alerts.dismissedAt))
    .orderBy(alerts.createdAt);

  return NextResponse.json(activeAlerts);
}

// PATCH /api/alerts/:id — dispensar um alerta
export async function PATCH(req: NextRequest) {
  const { id } = await req.json() as { id: string };

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  }

  await db
    .update(alerts)
    .set({ dismissedAt: new Date() })
    .where(eq(alerts.id, id));

  return NextResponse.json({ success: true });
}

// POST /api/alerts — criar alerta (n8n ou trigger interno)
export async function POST(req: NextRequest) {
  try {
    const { type, category, message } = await req.json() as {
      type: "budget_80pct" | "budget_exceeded" | "goal_reminder";
      category: string;
      message: string;
    };

    // Evita duplicatas
    const existing = await db.select().from(alerts)
      .where(sql`${alerts.type} = ${type} AND ${alerts.category} = ${category} AND ${alerts.dismissedAt} IS NULL`)
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Alert already active." });
    }

    const [alert] = await db.insert(alerts).values({ type, category, message }).returning();
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    console.error("Alerts POST error:", err);
    return NextResponse.json({ error: "Erro ao criar alerta." }, { status: 500 });
  }
}

// PUT /api/alerts — verificar condições e criar alertas automaticamente
// Chamar via n8n cron diário ou manualmente
export async function PUT() {
  try {
    const results: string[] = [];

    // Verificar orçamentos
    const budgetRows = await db.select().from(budgets);
    for (const b of budgetRows) {
      const pct = Number(b.limitAmount) > 0
        ? (Number(b.spentAmount) / Number(b.limitAmount)) * 100
        : 0;

      if (pct >= 100) {
        const existing = await db.select().from(alerts)
          .where(sql`${alerts.type} = 'budget_exceeded' AND ${alerts.category} = ${b.category} AND ${alerts.dismissedAt} IS NULL`)
          .limit(1);
        if (existing.length === 0) {
          await db.insert(alerts).values({
            type: "budget_exceeded",
            category: b.category,
            message: `Orçamento de ${b.category} estourado: R$ ${Number(b.spentAmount).toFixed(2)} / R$ ${Number(b.limitAmount).toFixed(2)} (${Math.round(pct)}%)`,
          });
          results.push(`budget_exceeded: ${b.category}`);
        }
      } else if (pct >= 80) {
        const existing = await db.select().from(alerts)
          .where(sql`${alerts.type} = 'budget_80pct' AND ${alerts.category} = ${b.category} AND ${alerts.dismissedAt} IS NULL`)
          .limit(1);
        if (existing.length === 0) {
          await db.insert(alerts).values({
            type: "budget_80pct",
            category: b.category,
            message: `Orçamento de ${b.category} em ${Math.round(pct)}%: R$ ${Number(b.spentAmount).toFixed(2)} / R$ ${Number(b.limitAmount).toFixed(2)}`,
          });
          results.push(`budget_80pct: ${b.category}`);
        }
      }
    }

    // Verificar metas próximas do prazo
    const goalRows = await db.select().from(goals).where(eq(goals.status, "active"));
    for (const g of goalRows) {
      const pct = Number(g.targetAmount) > 0
        ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100
        : 0;
      if (pct < 100 && g.deadline) {
        const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
        if (daysLeft > 0 && daysLeft <= 30) {
          const existing = await db.select().from(alerts)
            .where(sql`${alerts.type} = 'goal_reminder' AND ${alerts.category} = ${g.name} AND ${alerts.dismissedAt} IS NULL`)
            .limit(1);
          if (existing.length === 0) {
            await db.insert(alerts).values({
              type: "goal_reminder",
              category: g.name,
              message: `Meta "${g.name}" está em ${Math.round(pct)}% e vence em ${daysLeft} dias.`,
            });
            results.push(`goal_reminder: ${g.name}`);
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

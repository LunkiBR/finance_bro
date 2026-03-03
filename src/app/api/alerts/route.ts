import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";

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

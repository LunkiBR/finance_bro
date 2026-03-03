import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const rows = await db.select().from(goals);
        const enriched = rows.map((g) => ({
            ...g,
            current: Number(g.currentAmount),
            target: Number(g.targetAmount),
            pct: Number(g.targetAmount) > 0
                ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
                : 0,
        }));
        return NextResponse.json(enriched);
    } catch (err) {
        console.error("Goals error:", err);
        return NextResponse.json({ error: "Erro ao carregar metas." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        await db.insert(goals).values({
            name: body.name,
            targetAmount: body.targetAmount,
            currentAmount: body.currentAmount || "0",
            deadline: body.deadline || null,
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Goal create error:", err);
        return NextResponse.json({ error: "Erro ao criar meta." }, { status: 500 });
    }
}

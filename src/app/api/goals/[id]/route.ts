import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        if (body.addAmount) {
            // Increment current amount
            await db
                .update(goals)
                .set({
                    currentAmount: sql`${goals.currentAmount}::numeric + ${body.addAmount}::numeric`,
                })
                .where(eq(goals.id, id));
        }

        if (body.status) {
            await db.update(goals).set({ status: body.status }).where(eq(goals.id, id));
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Goal update error:", err);
        return NextResponse.json({ error: "Erro ao atualizar meta." }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.delete(goals).where(eq(goals.id, id));
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Goal delete error:", err);
        return NextResponse.json({ error: "Erro ao excluir meta." }, { status: 500 });
    }
}

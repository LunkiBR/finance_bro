import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encryptNumber, safeDecryptNumber } from "@/lib/encryption";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const { id } = await params;
        const body = await req.json();

        if (body.addAmount) {
            // Fetch → decrypt → add → encrypt → update
            const [row] = await db.select({ currentAmount: goals.currentAmount })
                .from(goals)
                .where(and(eq(goals.id, id), eq(goals.userId, userId)))
                .limit(1);
            if (row) {
                const current = safeDecryptNumber(row.currentAmount);
                const newAmount = current + Number(body.addAmount);
                await db
                    .update(goals)
                    .set({ currentAmount: encryptNumber(newAmount) })
                    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
            }
        }

        if (body.status) {
            await db
                .update(goals)
                .set({ status: body.status })
                .where(and(eq(goals.id, id), eq(goals.userId, userId)));
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
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const { id } = await params;
        await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Goal delete error:", err);
        return NextResponse.json({ error: "Erro ao excluir meta." }, { status: 500 });
    }
}

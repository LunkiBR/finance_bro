import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updates: Partial<{
            category: string;
            categoryConfidence: "high" | "low" | "manual";
        }> = {};

        if (body.category) {
            updates.category = body.category;
            updates.categoryConfidence = "manual";
        }

        await db.update(transactions).set(updates).where(eq(transactions.id, id));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Transaction update error:", err);
        return NextResponse.json(
            { error: "Erro ao atualizar transação." },
            { status: 500 }
        );
    }
}

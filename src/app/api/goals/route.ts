import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encrypt, encryptNumber, safeDecrypt, safeDecryptNumber } from "@/lib/encryption";

export async function GET() {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const rows = await db.select().from(goals).where(eq(goals.userId, userId));
        const enriched = rows.map((g) => {
            const current = safeDecryptNumber(g.currentAmount);
            const target = safeDecryptNumber(g.targetAmount);
            return {
                ...g,
                name: safeDecrypt(g.name),
                currentAmount: String(current),
                targetAmount: String(target),
                current,
                target,
                pct: target > 0 ? Math.round((current / target) * 100) : 0,
            };
        });
        return NextResponse.json(enriched);
    } catch (err) {
        console.error("Goals error:", err);
        return NextResponse.json({ error: "Erro ao carregar metas." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const body = await req.json();
        await db.insert(goals).values({
            userId,
            name: encrypt(body.name),
            targetAmount: encryptNumber(Number(body.targetAmount)),
            currentAmount: body.currentAmount ? encryptNumber(Number(body.currentAmount)) : encryptNumber(0),
            deadline: body.deadline || null,
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Goal create error:", err);
        return NextResponse.json({ error: "Erro ao criar meta." }, { status: 500 });
    }
}

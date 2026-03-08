import { NextRequest } from "next/server";
import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const convs = await db
            .select()
            .from(conversations)
            .where(eq(conversations.userId, userId))
            .orderBy(desc(conversations.updatedAt))
            .limit(50);

        return Response.json(convs);
    } catch (err) {
        console.error("Conversations GET error:", err);
        return Response.json([], { status: 200 });
    }
}

export async function POST() {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const [conv] = await db
            .insert(conversations)
            .values({ userId, title: "Nova conversa" })
            .returning();

        return Response.json(conv, { status: 201 });
    } catch (err) {
        console.error("Conversations POST error:", err);
        return Response.json({ error: "Erro ao criar conversa." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const { id, title } = await req.json() as { id: string; title: string };
        const [updated] = await db
            .update(conversations)
            .set({ title, updatedAt: new Date() })
            .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
            .returning();
        return Response.json(updated);
    } catch (err) {
        console.error("Conversations PUT error:", err);
        return Response.json({ error: "Erro ao atualizar." }, { status: 500 });
    }
}

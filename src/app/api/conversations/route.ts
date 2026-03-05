import { NextRequest } from "next/server";
import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/conversations — list all conversations (most recent first)
export async function GET() {
    try {
        const convs = await db
            .select()
            .from(conversations)
            .orderBy(desc(conversations.updatedAt))
            .limit(50);

        return Response.json(convs);
    } catch (err) {
        console.error("Conversations GET error:", err);
        return Response.json([], { status: 200 }); // never break the UI
    }
}

// POST /api/conversations — create a new conversation
export async function POST() {
    try {
        const [conv] = await db
            .insert(conversations)
            .values({ title: "Nova conversa" })
            .returning();

        return Response.json(conv, { status: 201 });
    } catch (err) {
        console.error("Conversations POST error:", err);
        return Response.json({ error: "Erro ao criar conversa." }, { status: 500 });
    }
}

// GET /api/conversations/[id]/messages is handled in the nested route
// But we'll also support: GET /api/conversations?id=xxx to return messages
export async function PUT(req: NextRequest) {
    // PATCH: update title of a conversation
    try {
        const { id, title } = await req.json() as { id: string; title: string };
        const [updated] = await db
            .update(conversations)
            .set({ title, updatedAt: new Date() })
            .where(eq(conversations.id, id))
            .returning();
        return Response.json(updated);
    } catch (err) {
        console.error("Conversations PUT error:", err);
        return Response.json({ error: "Erro ao atualizar." }, { status: 500 });
    }
}

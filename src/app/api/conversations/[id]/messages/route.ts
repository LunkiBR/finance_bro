import { NextRequest } from "next/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/conversations/[id]/messages
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, id))
            .orderBy(desc(chatMessages.createdAt))
            .limit(100);

        return Response.json(messages.reverse());
    } catch (err) {
        console.error("Messages GET error:", err);
        return Response.json([]);
    }
}

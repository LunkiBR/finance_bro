import { NextRequest } from "next/server";
import { db } from "@/db";
import { chatMessages, conversations } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { safeDecrypt, isEncrypted, decrypt } from "@/lib/encryption";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const { id } = await params;

        // Verify conversation belongs to this user
        const [conv] = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
            .limit(1);

        if (!conv) {
            return Response.json([], { status: 200 });
        }

        const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, id))
            .orderBy(desc(chatMessages.createdAt))
            .limit(100);

        const decrypted = messages.map(m => {
            let chartSpec = m.chartSpec;
            if (typeof chartSpec === "string" && isEncrypted(chartSpec)) {
                try { chartSpec = JSON.parse(decrypt(chartSpec)); } catch { /* keep as-is */ }
            }
            return {
                ...m,
                content: safeDecrypt(m.content),
                chartSpec,
            };
        });

        return Response.json(decrypted.reverse());
    } catch (err) {
        console.error("Messages GET error:", err);
        return Response.json([]);
    }
}

import { NextRequest } from "next/server";
import { genai, financeTools, executeTool, SYSTEM_PROMPT, buildContextSnapshot } from "@/lib/claude";
import { db } from "@/db";
import { chatMessages, conversations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { ChartSpec } from "@/lib/chart-types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = (await req.json()) as {
      message: string;
      conversationId?: string;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Mensagem vazia." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolve or create a conversation
    let convId = conversationId;
    if (!convId) {
      const [conv] = await db
        .insert(conversations)
        .values({ title: "Nova conversa" })
        .returning();
      convId = conv.id;
    }

    // Busca histórico da conversa
    let history: typeof chatMessages.$inferSelect[] = [];
    try {
      history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, convId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);
    } catch (dbErr) {
      console.error("Chat: falha ao buscar histórico:", dbErr);
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Envia o conversationId logo no início do stream
    (async () => {
      let fullResponse = "";
      let chartSpec: ChartSpec | undefined;

      try {
        // Sinaliza o conversationId logo de início
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`
          )
        );

        // Salva a mensagem do usuário
        try {
          await db.insert(chatMessages).values({
            conversationId: convId,
            role: "user",
            content: message,
          });
        } catch (dbErr) {
          console.error("Chat: falha ao salvar mensagem do usuário:", dbErr);
        }

        // Build context snapshot (live financial state)
        const contextSnapshot = await buildContextSnapshot();
        const systemInstructionWithContext = contextSnapshot
          ? `${SYSTEM_PROMPT}\n\n${contextSnapshot}`
          : SYSTEM_PROMPT;

        const model = genai.getGenerativeModel({
          model: "gemini-2.5-flash",
          tools: [
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              functionDeclarations: financeTools as any,
            },
          ],
          systemInstruction: systemInstructionWithContext,
        });

        const conversationHistory = history
          .reverse()
          .map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }))
          .concat([{ role: "user" as const, parts: [{ text: message }] }]);

        const chat = model.startChat({
          history: conversationHistory.slice(0, -1),
        });

        let continueLoop = true;

        while (continueLoop) {
          const lastParts = conversationHistory[conversationHistory.length - 1].parts;
          const response = await chat.sendMessage(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lastParts as any
          );

          const functionCalls = (response.response.functionCalls() ?? []).filter((fc) => fc);

          if (functionCalls.length > 0) {
            const functionResults = [];

            for (const fc of functionCalls) {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_use", tool: fc.name })}\n\n`
                )
              );

              const { result, chartSpec: cs } = await executeTool(
                fc.name,
                fc.args as Record<string, unknown>
              );

              if (cs) chartSpec = cs;

              functionResults.push({
                functionResponse: { name: fc.name, response: result },
              });
            }

            conversationHistory.push({
              role: "model" as const,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              parts: (response.response.candidates?.[0]?.content?.parts ?? []) as any,
            });
            conversationHistory.push({
              role: "user" as const,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              parts: functionResults as any,
            });
          } else {
            const textContent = response.response.text();
            fullResponse += textContent;

            const chunkSize = 50;
            for (let i = 0; i < textContent.length; i += chunkSize) {
              const chunk = textContent.slice(i, i + chunkSize);
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`)
              );
              await new Promise((r) => setTimeout(r, 10));
            }

            continueLoop = false;
          }
        }

        if (chartSpec) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "chart", spec: chartSpec })}\n\n`)
          );
        }

        // Salva resposta do assistente
        try {
          await db.insert(chatMessages).values({
            conversationId: convId,
            role: "assistant",
            content: fullResponse,
            chartSpec: chartSpec ?? null,
          });

          // Atualiza updated_at da conversa
          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, convId!));

          // Auto-título: usa as primeiras 50 chars da primeira mensagem do usuário
          const existingTitle = history.length === 0
            ? message.slice(0, 50) + (message.length > 50 ? "…" : "")
            : null;
          if (existingTitle) {
            await db
              .update(conversations)
              .set({ title: existingTitle })
              .where(eq(conversations.id, convId!));
          }
        } catch (dbErr) {
          console.error("Chat: falha ao salvar resposta:", dbErr);
        }

        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (err) {
        console.error("Chat error:", err);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Erro ao processar resposta." })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return new Response(JSON.stringify({ error: "Erro interno." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  // Keep backward compat — legacy history (not scoped by conversation)
  try {
    const history = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);

    return new Response(JSON.stringify(history.reverse()), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat GET error:", err);
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

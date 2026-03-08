import { NextRequest } from "next/server";
import { genai, financeTools, executeTool, getSystemPrompt, buildContextSnapshot } from "@/lib/claude";
import { db } from "@/db";
import { chatMessages, conversations, userProfile } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { ChartSpec } from "@/lib/chart-types";
import { requireAuth } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TOOL_ITERATIONS = 10;

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

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
        .values({ userId, title: "Nova conversa" })
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
      const chartSpecs: ChartSpec[] = [];

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
            userId,
            conversationId: convId,
            role: "user",
            content: message,
          });
        } catch (dbErr) {
          console.error("Chat: falha ao salvar mensagem do usuário:", dbErr);
        }

        // Fetch user info for personalization
        const profileInfo = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
        const userName = profileInfo[0]?.nome || "usuário";
        const systemPrompt = getSystemPrompt(userName);

        // Build context snapshot (live financial state)
        const contextSnapshot = await buildContextSnapshot(userId);
        const systemInstructionWithContext = contextSnapshot
          ? `${systemPrompt}\n\n${contextSnapshot}`
          : systemPrompt;

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

        // Build raw history from DB (ASC order after reverse)
        const rawHistory = history
          .reverse()
          .map((m) => ({
            role: (m.role === "user" ? "user" : "model") as "user" | "model",
            // Guard against empty text — Gemini rejects empty parts
            parts: [{ text: m.content || " " }],
          }));

        // Repair history: remove consecutive same-role turns and orphaned trailing user messages.
        // This prevents INVALID_ARGUMENT when a previous request saved the user message
        // but failed before saving the assistant response.
        const repairedHistory: typeof rawHistory = [];
        for (const item of rawHistory) {
          const prev = repairedHistory[repairedHistory.length - 1];
          if (prev && prev.role === item.role) {
            // Drop the older duplicate; keep the newer one
            repairedHistory.pop();
          }
          repairedHistory.push(item);
        }
        // History passed to startChat must end with "model" (completed pairs)
        while (repairedHistory.length > 0 && repairedHistory[repairedHistory.length - 1].role === "user") {
          repairedHistory.pop();
        }

        const conversationHistory = repairedHistory.concat([
          { role: "user" as const, parts: [{ text: message }] },
        ]);

        const chat = model.startChat({
          history: conversationHistory.slice(0, -1),
        });

        let continueLoop = true;
        let iterations = 0;

        while (continueLoop) {
          iterations++;

          // Guard against infinite tool loops
          if (iterations > MAX_TOOL_ITERATIONS) {
            console.warn(`Chat: max tool iterations (${MAX_TOOL_ITERATIONS}) reached`);
            const warningMsg = "\n\nAtingi o limite de consultas para esta pergunta. Aqui está o que encontrei até agora.";
            fullResponse += warningMsg;
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: "text", text: warningMsg })}\n\n`)
            );
            continueLoop = false;
            break;
          }

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

              // Per-tool try/catch — one tool failure doesn't crash the stream
              try {
                const { result, chartSpec: cs } = await executeTool(
                  fc.name,
                  fc.args as Record<string, unknown>,
                  userId
                );

                if (cs) {
                  chartSpecs.push(cs);
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ type: "chart", spec: cs })}\n\n`)
                  );
                }

                // Gemini FunctionResponse.response maps to protobuf Struct which only
                // accepts plain JSON objects (string-keyed). Wrap non-object results.
                const responseValue =
                  typeof result === "object" && result !== null && !Array.isArray(result)
                    ? (result as object)
                    : { result }; // wraps arrays, strings, numbers, null

                functionResults.push({
                  functionResponse: { name: fc.name, response: responseValue },
                });
              } catch (toolErr: unknown) {
                const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
                console.error(`Tool ${fc.name} error:`, toolErr);
                functionResults.push({
                  functionResponse: {
                    name: fc.name,
                    response: { error: `Erro ao executar ${fc.name}: ${errMsg}` },
                  },
                });
              }
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

        // Salva resposta do assistente
        try {
          await db.insert(chatMessages).values({
            userId,
            conversationId: convId,
            role: "assistant",
            content: fullResponse,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            chartSpec: chartSpecs.length > 0 ? (chartSpecs as any) : null,
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
      } catch (err: unknown) {
        console.error("Chat error:", err);

        let userMessage = "Erro ao processar resposta.";
        let errorType = "unknown";
        let retryable = false;

        const errMsg = err instanceof Error ? err.message : String(err);
        const errStatus = (err as { status?: number })?.status;

        // Classify error for specific user feedback
        if (errStatus === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
          userMessage = "O serviço de IA está temporariamente sobrecarregado. Tente novamente em alguns segundos.";
          errorType = "rate_limit";
          retryable = true;
        } else if (errStatus === 400 || errMsg.includes("INVALID_ARGUMENT")) {
          userMessage = "Erro na comunicação com a IA. A mensagem pode ter sido muito longa ou conter conteúdo inválido.";
          errorType = "invalid_request";
        } else if (errMsg.includes("SAFETY") || errMsg.includes("blocked")) {
          userMessage = "A IA não conseguiu processar essa pergunta por restrições de segurança. Tente reformular.";
          errorType = "safety_filter";
        } else if (errMsg.includes("fetch") || errMsg.includes("ECONNREFUSED") || errMsg.includes("ENOTFOUND")) {
          userMessage = "Erro de conexão com o servidor de IA. Verifique sua conexão de internet.";
          errorType = "network";
          retryable = true;
        } else if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT") || errMsg.includes("deadline")) {
          userMessage = "A consulta demorou demais para processar. Tente uma pergunta mais simples.";
          errorType = "timeout";
          retryable = true;
        } else if (errMsg.includes("quota") || errMsg.includes("billing")) {
          userMessage = "Cota da API de IA excedida. Entre em contato com o administrador.";
          errorType = "quota";
        } else {
          // Include truncated error detail for debugging
          userMessage = `Erro ao processar resposta: ${errMsg.slice(0, 150)}`;
          retryable = true;
        }

        // If there's partial response, send it before the error
        if (fullResponse.length > 0) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({
              type: "text",
              text: "\n\n---\n_[Resposta interrompida por erro]_"
            })}\n\n`)
          );
        }

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: userMessage, errorType, retryable })}\n\n`
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
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Erro interno: ${errMsg.slice(0, 200)}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const history = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
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

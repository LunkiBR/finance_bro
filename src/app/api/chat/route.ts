import { NextRequest } from "next/server";
import { genai, financeTools, executeTool, SYSTEM_PROMPT } from "@/lib/claude";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { ChartSpec } from "@/lib/chart-types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { message } = (await req.json()) as { message: string };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Mensagem vazia." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Busca histórico de mensagens — se falhar, usa histórico vazio
    let history: typeof chatMessages.$inferSelect[] = [];
    try {
      history = await db
        .select()
        .from(chatMessages)
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);
    } catch (dbErr) {
      console.error("Chat: falha ao buscar histórico:", dbErr);
      // Continua sem histórico — não bloqueia o stream
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Processa em background
    (async () => {
      let fullResponse = "";
      let chartSpec: ChartSpec | undefined;

      try {
        // Salva a mensagem do usuário (dentro do background — não bloqueia o stream)
        try {
          await db.insert(chatMessages).values({
            role: "user",
            content: message,
          });
        } catch (dbErr) {
          console.error("Chat: falha ao salvar mensagem do usuário:", dbErr);
        }

        const model = genai.getGenerativeModel({
          model: "gemini-2.5-flash",
          tools: [
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              functionDeclarations: financeTools as any,
            },
          ],
          systemInstruction: SYSTEM_PROMPT,
        });

        // Constrói histórico para Gemini (sem chart_spec inline)
        const conversationHistory = history
          .reverse()
          .map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }))
          .concat([{ role: "user" as const, parts: [{ text: message }] }]);

        // Inicia o chat
        const chat = model.startChat({
          history: conversationHistory.slice(0, -1),
        });

        // Loop de agente: Gemini pode chamar múltiplas ferramentas
        let continueLoop = true;

        while (continueLoop) {
          const lastPart = conversationHistory[conversationHistory.length - 1].parts[0];
          const response = await chat.sendMessage(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lastPart as any
          );

          const functionCalls = (response.response
            .functionCalls() ?? [])
            .filter((fc) => fc);

          if (functionCalls.length > 0) {
            // Processa cada function call
            const functionResults = [];

            for (const fc of functionCalls) {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_use",
                    tool: fc.name,
                  })}\n\n`
                )
              );

              const { result, chartSpec: cs } = await executeTool(
                fc.name,
                fc.args as Record<string, unknown>
              );

              if (cs) chartSpec = cs;

              functionResults.push({
                functionResponse: {
                  name: fc.name,
                  response: result,
                },
              });
            }

            // Envia os resultados de volta para Gemini continuar a conversa
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
            // Resposta final — transmite em chunks
            const textContent = response.response.text();
            fullResponse += textContent;

            // Envia em chunks de ~50 chars para efeito de streaming
            const chunkSize = 50;
            for (let i = 0; i < textContent.length; i += chunkSize) {
              const chunk = textContent.slice(i, i + chunkSize);
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`
                )
              );
              await new Promise((r) => setTimeout(r, 10));
            }

            continueLoop = false;
          }
        }

        // Envia o chartSpec se houver
        if (chartSpec) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "chart",
                spec: chartSpec,
              })}\n\n`
            )
          );
        }

        // Salva resposta do assistente no histórico
        try {
          await db.insert(chatMessages).values({
            role: "assistant",
            content: fullResponse,
            chartSpec: chartSpec ?? null,
          });
        } catch (dbErr) {
          console.error("Chat: falha ao salvar resposta do assistente:", dbErr);
        }

        // Sinaliza fim do stream
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done" })}\n\n`
          )
        );
      } catch (err) {
        console.error("Chat error:", err);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Erro ao processar resposta.",
            })}\n\n`
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
  // Retorna histórico de mensagens
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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const allowedTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    const isCSV =
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".txt");

    if (!isCSV) {
      return NextResponse.json(
        { error: "Apenas arquivos CSV são suportados." },
        { status: 400 }
      );
    }

    // Detect encoding: try UTF-8 first, fallback to Windows-1252 (common in BR banks)
    const buffer = await file.arrayBuffer();
    const utf8Content = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
    const csvContent = utf8Content.includes("\uFFFD")
      ? new TextDecoder("windows-1252").decode(new Uint8Array(buffer))
      : utf8Content;

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
    }

    const profileInfo = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
    const userName = profileInfo[0]?.nome || "usuário";

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL não configurado." },
        { status: 500 }
      );
    }

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        filename: file.name,
        csvContent,
        uploadedAt: new Date().toISOString(),
        userName,
        userId,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n error:", errorText);
      return NextResponse.json(
        { error: "Erro ao processar extrato no pipeline." },
        { status: 502 }
      );
    }

    const result = await n8nResponse.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "Extrato enviado para processamento.",
      transactions: result.transactionsProcessed ?? null,
      alerts: result.alertsCreated ?? null,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar o arquivo." },
      { status: 500 }
    );
  }
}

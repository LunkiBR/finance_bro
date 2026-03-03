import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    // Lê o CSV em memória (sem persistir no servidor)
    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
    }

    // Envia ao n8n para processamento
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

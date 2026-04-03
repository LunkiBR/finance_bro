import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import * as XLSX from "xlsx";

/* ─── File type detection ─── */

function getFileType(filename: string, mimeType: string): "csv" | "excel" | "pdf" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt") || mimeType === "text/csv") return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "excel";
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  return null;
}

/* ─── Excel → CSV ─── */

function excelToCSV(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("Planilha vazia.");
  const sheet = workbook.Sheets[firstSheet];

  // Detect separator: BB banks expect comma in n8n patterns; all others use semicolon.
  const csvComma = XLSX.utils.sheet_to_csv(sheet, { FS: "," });
  const headerComma = csvComma.split("\n")[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isCommaBankFormat =
    /^data,depend/.test(headerComma) ||   // bb_conta
    /^data da compra,/.test(headerComma); // bb_cc

  const csv = isCommaBankFormat
    ? csvComma
    : XLSX.utils.sheet_to_csv(sheet, { FS: ";" });

  if (!csv.trim()) throw new Error("Planilha sem dados.");
  return csv;
}

/* ─── CSV text decoding ─── */

function decodeCSVContent(buffer: Buffer): string {
  const utf8 = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
  return utf8.includes("\uFFFD")
    ? new TextDecoder("windows-1252").decode(new Uint8Array(buffer))
    : utf8;
}

/* ─── Main handler ─── */

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

    const fileType = getFileType(file.name, file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: "Formato não suportado. Use CSV, Excel (.xlsx/.xls) ou PDF." },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const profileInfo = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
    const userName = profileInfo[0]?.nome || "usuário";

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL não configurado." }, { status: 500 });
    }

    let n8nResponse: Response;

    if (fileType === "pdf") {
      // PDF: send as base64 JSON — n8n decodes to /tmp, LlamaParse reads, Gemini formats
      const pdfWebhookUrl = process.env.N8N_PDF_WEBHOOK_URL ?? n8nUrl;

      n8nResponse = await fetch(pdfWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          pdfBase64: rawBuffer.toString("base64"),
          userId,
          userName,
          uploadedAt: new Date().toISOString(),
          encryptionKey: process.env.ENCRYPTION_KEY,
        }),
      });
    } else {
      // CSV/Excel: convert to CSV string → existing n8n pipeline
      const csvContent = fileType === "csv"
        ? decodeCSVContent(rawBuffer)
        : excelToCSV(rawBuffer);

      if (!csvContent.trim()) {
        return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
      }

      n8nResponse = await fetch(n8nUrl, {
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
          encryptionKey: process.env.ENCRYPTION_KEY,
        }),
      });
    }

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
    const message = err instanceof Error ? err.message : "Erro interno ao processar o arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

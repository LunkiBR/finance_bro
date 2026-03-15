import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { LlamaCloud } from "@llamaindex/llama-cloud";
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
  // Try comma first and check if the header matches a comma-based bank format.
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

/* ─── PDF → CSV (via LlamaParse) ─── */

async function pdfToCSV(buffer: Buffer, filename: string): Promise<string> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) throw new Error("LLAMA_CLOUD_API_KEY não configurado.");

  const client = new LlamaCloud({ apiKey });

  const file = new File([new Uint8Array(buffer)], filename, { type: "application/pdf" });

  const result = await client.parsing.parse(
    {
      tier: "cost_effective",
      version: "latest",
      upload_file: file,
      expand: ["markdown_full"],
    },
    { timeout: 120, pollingInterval: 2 }
  );

  const markdown = result.markdown_full;
  if (!markdown) throw new Error("LlamaParse não retornou conteúdo do PDF.");

  const csv = markdownTableToCSV(markdown);
  if (!csv.trim()) throw new Error("Nenhuma tabela encontrada no PDF. Verifique se o arquivo contém um extrato bancário.");

  return csv;
}

/* ─── Markdown/HTML table → CSV ─── */

function markdownTableToCSV(markdown: string): string {
  // LlamaParse can return either pipe-markdown tables or HTML <table> tags
  if (markdown.includes("<table")) {
    return htmlTableToCSV(markdown);
  }
  return pipeTableToCSV(markdown);
}

function htmlTableToCSV(html: string): string {
  const csvLines: string[] = [];
  // Extract all <tr> blocks
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    // Match both <th> and <td> cells
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, "").trim()); // strip inner tags
    if (cells.length > 0) {
      csvLines.push(cells.join(";"));
    }
  }
  return csvLines.join("\n");
}

function pipeTableToCSV(markdown: string): string {
  const lines = markdown.split("\n");
  const csvLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip separator rows (|---|---|)
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
    // Extract cells from table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map(c => c.trim());
      csvLines.push(cells.join(";"));
    }
  }
  return csvLines.join("\n");
}

/* ─── CSV text decoding (existing logic) ─── */

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
    let csvContent: string;

    switch (fileType) {
      case "csv":
        csvContent = decodeCSVContent(rawBuffer);
        break;
      case "excel":
        csvContent = excelToCSV(rawBuffer);
        break;
      case "pdf":
        csvContent = await pdfToCSV(rawBuffer, file.name);
        break;
    }

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
    const message = err instanceof Error ? err.message : "Erro interno ao processar o arquivo.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

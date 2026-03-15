// Test LlamaParse integration using a public sample PDF
// Run with: node test-fixtures/test-llamaparse.mjs

import { LlamaCloud } from "@llamaindex/llama-cloud";
import fs from "fs";
import https from "https";
import path from "path";

const API_KEY = process.env.LLAMAPARSE_API_KEY ?? "";
const FIXTURES = path.dirname(new URL(import.meta.url).pathname);

// Download a sample PDF from LlamaIndex's own test suite
const SAMPLE_PDF_URL =
  "https://raw.githubusercontent.com/run-llama/llama_cloud_services/main/docs/sample.pdf";

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (r2) => {
          r2.pipe(file);
          file.on("finish", () => { file.close(); resolve(); });
        }).on("error", reject);
      } else {
        response.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
      }
    }).on("error", reject);
  });
}

// markdownTableToCSV — same as in route.ts
function markdownTableToCSV(markdown) {
  const lines = markdown.split("\n");
  const csvLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
      csvLines.push(cells.join(";"));
    }
  }
  return csvLines.join("\n");
}

async function testWithCustomContent() {
  console.log("=== Test 1: LlamaParse API health check (no file) ===");
  const client = new LlamaCloud({ apiKey: API_KEY });

  // Just verify the client initializes and the API key is valid by listing jobs
  try {
    const jobs = await client.parsing.list({ limit: 1 });
    console.log("✓ API key valid. Recent jobs:", jobs.items?.length ?? 0);
  } catch (e) {
    console.error("✗ API error:", e.message);
    process.exit(1);
  }
}

async function testWithURL() {
  console.log("\n=== Test 2: Parse PDF from URL ===");
  const client = new LlamaCloud({ apiKey: API_KEY });

  // Use a simple single-page PDF from a reliable source
  // Using LlamaIndex's own sample document
  const testPdfUrl = "https://www.africau.edu/images/default/sample.pdf";

  try {
    console.log("  Parsing PDF from URL:", testPdfUrl);
    const result = await client.parsing.parse(
      {
        tier: "cost_effective",
        version: "latest",
        source_url: testPdfUrl,
        expand: ["markdown_full"],
      },
      { timeout: 60, pollingInterval: 3 }
    );

    console.log("  Job status:", result.job.status);
    console.log("  Markdown length:", result.markdown_full?.length ?? 0, "chars");
    if (result.markdown_full) {
      console.log("  First 300 chars of markdown:");
      console.log("  " + result.markdown_full.substring(0, 300).replace(/\n/g, "\n  "));
    }
    console.log("✓ URL parse successful");
  } catch (e) {
    console.error("✗ URL parse error:", e.message);
  }
}

async function testWithUploadedFile() {
  console.log("\n=== Test 3: Parse uploaded PDF file ===");
  const client = new LlamaCloud({ apiKey: API_KEY });

  // Create a minimal PDF in-memory using raw PDF syntax (no dependencies)
  // This is a valid minimal PDF with a table-like structure
  const minimalPDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 300>>
stream
BT
/F1 12 Tf
50 750 Td (Extrato Bancario - Janeiro 2024) Tj
0 -30 Td (Data       Descricao              Valor) Tj
0 -20 Td (15/01/2024 iFood *Restaurant      -45.90) Tj
0 -20 Td (16/01/2024 Uber                   -22.50) Tj
0 -20 Td (17/01/2024 Netflix                -39.90) Tj
0 -20 Td (18/01/2024 Salario recebido     +5000.00) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000626 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
706
%%EOF`;

  const pdfBuffer = Buffer.from(minimalPDF);
  const file = new File([new Uint8Array(pdfBuffer)], "test-extrato.pdf", {
    type: "application/pdf",
  });

  try {
    console.log("  Uploading minimal PDF (", pdfBuffer.length, "bytes)...");
    const result = await client.parsing.parse(
      {
        tier: "cost_effective",
        version: "latest",
        upload_file: file,
        expand: ["markdown_full", "text_full"],
      },
      { timeout: 60, pollingInterval: 3 }
    );

    console.log("  Job status:", result.job.status);
    console.log("  Markdown full length:", result.markdown_full?.length ?? 0);
    console.log("  Text full length:", result.text_full?.length ?? 0);

    if (result.markdown_full) {
      console.log("  Markdown content:");
      console.log(result.markdown_full);
      const csv = markdownTableToCSV(result.markdown_full);
      if (csv) {
        console.log("  Extracted as CSV:");
        console.log(csv);
      }
    } else if (result.text_full) {
      console.log("  Text content:");
      console.log(result.text_full.substring(0, 500));
    }
    console.log("✓ File upload + parse successful");
  } catch (e) {
    console.error("✗ File upload parse error:", e.message);
    if (e.status) console.error("  HTTP status:", e.status);
  }
}

// Run all tests
console.log("Testing LlamaParse integration...\n");
await testWithCustomContent();
await testWithURL();
await testWithUploadedFile();
console.log("\n=== Done ===");

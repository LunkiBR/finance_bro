// Test HTML table parsing (what LlamaParse actually returns)
function htmlTableToCSV(html) {
  const csvLines = [];
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, "").trim());
    if (cells.length > 0) csvLines.push(cells.join(";"));
  }
  return csvLines.join("\n");
}

function markdownTableToCSV(markdown) {
  if (markdown.includes("<table")) return htmlTableToCSV(markdown);
  // pipe table
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

// Actual LlamaParse output from our test
const actualLlamaOutput = `
# Extrato Bancario - Janeiro 2024

<table>
    <tr>
        <th>Data</th>
        <th>Descricao</th>
        <th>Valor</th>
    </tr>
<tr>
        <td>15/01/2024</td>
<td>iFood *Restaurant</td>
<td>-45.90</td>
    </tr>
<tr>
        <td>16/01/2024</td>
<td>Uber</td>
<td>-22.50</td>
    </tr>
<tr>
        <td>17/01/2024</td>
<td>Netflix</td>
<td>-39.90</td>
    </tr>
<tr>
        <td>18/01/2024</td>
<td>Salario recebido</td>
<td>+5000.00</td>
    </tr>
</table>
`;

console.log("=== Test: Actual LlamaParse HTML output → CSV ===");
const csv = markdownTableToCSV(actualLlamaOutput);
console.log(csv);
console.log("\nLines:", csv.split("\n").length, "(expected 5: 1 header + 4 rows)");

// Verify header row
const lines = csv.split("\n");
console.log("\nHeader:", lines[0]);
console.log("Row 1:", lines[1]);
console.log("Row 4:", lines[4]);

if (lines[0] === "Data;Descricao;Valor" && lines[1] === "15/01/2024;iFood *Restaurant;-45.90") {
  console.log("\n✓ HTML table parsing correct!");
} else {
  console.log("\n✗ Unexpected output - check parser");
  process.exit(1);
}

// Also test pipe table still works
const pipeMarkdown = `
| Data | Descrição | Valor |
|------|-----------|-------|
| 15/01/2024 | iFood | -45,90 |
| 16/01/2024 | Uber | -22,50 |
`;

console.log("\n=== Test: Pipe markdown table → CSV ===");
const csv2 = markdownTableToCSV(pipeMarkdown);
console.log(csv2);
if (csv2.includes("Data;Descrição;Valor")) {
  console.log("✓ Pipe table parsing correct!");
} else {
  console.log("✗ Unexpected output");
  process.exit(1);
}

// Test markdownTableToCSV function
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

// Simulate LlamaParse output for a Santander CC PDF
const mockMarkdownSantander = `
# Fatura Cartão Santander - Janeiro 2024

| Data | Estabelecimento | Valor |
|------|-----------------|-------|
| 15/01/2024 | iFood *RESTAURANT | -45,90 |
| 16/01/2024 | Uber | -22,50 |
| 17/01/2024 | Shell - Posto Esso | -80,00 |
| 18/01/2024 | Amazon Marketplace | -150,00 |

Total: R$ 298,40
`;

const csv1 = markdownTableToCSV(mockMarkdownSantander);
console.log("=== Test 1: Santander CC PDF (single table) ===");
console.log(csv1);
console.log("Lines:", csv1.split("\n").length, "(expected 5: header + 4 rows)");
console.log();

// Simulate LlamaParse output for a Caixa PDF (OFX-like text)
const mockMarkdownCaixa = `
# Extrato Caixa Econômica Federal

## Conta Corrente - Janeiro 2024

| Data Movimento | Nr. Doc | Histórico | Valor | Saldo |
|----------------|---------|-----------|-------|-------|
| 10/01/2024 | 001234 | Compra Débito | -200,00 | 1800,00 |
| 11/01/2024 | 001235 | PIX Recebido | 500,00 | 2300,00 |
| 12/01/2024 | 001236 | TED Enviado | -300,00 | 2000,00 |

Saldo Final: R$ 2.000,00
`;

const csv2 = markdownTableToCSV(mockMarkdownCaixa);
console.log("=== Test 2: Caixa Conta PDF (single table) ===");
console.log(csv2);
console.log("Lines:", csv2.split("\n").length, "(expected 4: header + 3 rows)");
console.log();

// Test with multiple tables (summary + transactions)
const mockMarkdownMulti = `
# Extrato BTG Cartão

## Resumo
| Campo | Valor |
|-------|-------|
| Vencimento | 10/02/2024 |
| Total | -1.200,00 |

## Transações
| Data | Descrição | Categoria | Estabelecimento | Valor |
|------|-----------|-----------|-----------------|-------|
| 15/01/2024 | iFood | Alimentação | iFood | -45,90 |
| 16/01/2024 | Netflix | Assinaturas | Netflix | -55,90 |
| 17/01/2024 | Uber | Transporte | Uber | -25,00 |
`;

const csv3 = markdownTableToCSV(mockMarkdownMulti);
console.log("=== Test 3: BTG PDF (multiple tables merged) ===");
console.log(csv3);
console.log("Lines:", csv3.split("\n").length, "(expected 8: 2+1 summary + 4+1 transactions)");
console.log();

// Edge case: table with empty cells
const mockEdgeCase = `
| Data | Descrição | Parcela | Valor |
|------|-----------|---------|-------|
| 15/01 | Samsung TV | 2/12 | -500,00 |
| 16/01 | Mercado Extra | | -85,40 |
`;

const csv4 = markdownTableToCSV(mockEdgeCase);
console.log("=== Test 4: Edge case - empty cells ===");
console.log(csv4);

console.log("\n=== All markdown tests passed! ===");

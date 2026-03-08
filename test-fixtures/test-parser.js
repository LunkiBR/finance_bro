/**
 * Script de teste do parser multi-banco do Finance Friend.
 * Roda em Node.js puro sem dependências externas.
 *
 * Uso: node test-fixtures/test-parser.js
 */

const fs = require("fs");
const path = require("path");

// ─── Stub do n8n runtime ───────────────────────────────────────────────────────
// O n8n-pipeline.js usa $input.first().json — precisamos simular isso.

function runParser(csvContent, filename) {
  // Cria um contexto simulado do n8n
  const mockInput = {
    body: { csvContent, filename, userId: "test-user-uuid" },
    categoryRules: [],
    payeeMappings: [],
  };

  // Injeta $input global e executa o código
  const code = fs.readFileSync(path.join(__dirname, "../n8n-pipeline.js"), "utf-8")
    .replace(
      "const item = $input.first().json;",
      `const item = ${JSON.stringify(mockInput)};`
    )
    // Remove a última linha (return) e captura o resultado
    .replace(/return transactions\.map\(tx => \(\{ json: tx \}\)\);$/, "");

  // eslint-disable-next-line no-new-func
  const fn = new Function("transactions", code + "\nreturn transactions.map(tx => ({ json: tx }));");

  let transactions = [];
  fn(transactions);
  return transactions.map(t => t.json);
}

// Versão simples: executa como script e captura resultado
function runParserSimple(csvContent, filename) {
  // Redefine globais necessárias
  global.$input = {
    first: () => ({
      json: {
        body: { csvContent, filename, userId: "test-user-uuid" },
        categoryRules: [],
        payeeMappings: [],
      }
    })
  };

  // Limpa módulo do cache para re-executar
  const modulePath = require.resolve(path.join(__dirname, "../../n8n-pipeline.js"));

  // Como o pipeline usa return no top level, precisamos de eval
  const code = fs.readFileSync(path.join(__dirname, "../../n8n-pipeline.js"), "utf-8");

  // Substitui o return final por assignment
  const modifiedCode = code.replace(
    /return transactions\.map\(tx => \(\{ json: tx \}\)\);/,
    "__result = transactions.map(tx => ({ json: tx }));"
  );

  let __result = [];
  try {
    // eslint-disable-next-line no-eval
    eval(modifiedCode);
  } catch (e) {
    throw e;
  }
  return __result.map(item => item.json);
}

// ─── Casos de teste ───────────────────────────────────────────────────────────

const FIXTURES_DIR = __dirname;

const tests = [
  { file: "nubank_cc_antigo.csv",  expectedSource: "nubank_cc",       expectedCount: 4, expectedType: "despesa" },
  { file: "nubank_cc_novo.csv",    expectedSource: "nubank_cc",       expectedCount: 4, expectedType: "despesa" },
  { file: "nubank_conta.csv",      expectedSource: "nubank_conta",    expectedCount: 3, expectedType: "mixed" },
  { file: "c6_cc.csv",             expectedSource: "c6_cc",           expectedCount: 4, expectedType: "despesa" },
  { file: "c6_conta.csv",          expectedSource: "c6_conta",        expectedCount: 4, expectedType: "mixed" },
  { file: "inter_cc.csv",          expectedSource: "inter_cc",        expectedCount: 4, expectedType: "despesa" },
  { file: "inter_conta.csv",       expectedSource: "inter_conta",     expectedCount: 4, expectedType: "mixed" },
  { file: "santander_cc.csv",      expectedSource: "santander_cc",    expectedCount: 4, expectedType: "despesa" },
  { file: "santander_conta.csv",   expectedSource: "santander_conta", expectedCount: 4, expectedType: "mixed" },
  { file: "bradesco_cc.csv",       expectedSource: "bradesco_cc",     expectedCount: 4, expectedType: "despesa" },
  { file: "bradesco_conta.csv",    expectedSource: "bradesco_conta",  expectedCount: 4, expectedType: "mixed" },
  { file: "itau_conta.csv",        expectedSource: "itau_conta",      expectedCount: 4, expectedType: "mixed" },
  { file: "bb_conta.csv",          expectedSource: "bb_conta",        expectedCount: 4, expectedType: "mixed" },
  { file: "bb_cc.csv",             expectedSource: "bb_cc",           expectedCount: 4, expectedType: "despesa" },
  { file: "caixa_conta.csv",       expectedSource: "caixa_conta",     expectedCount: 4, expectedType: "mixed" },
  { file: "btg_cc.csv",            expectedSource: "btg_cc",          expectedCount: 4, expectedType: "despesa" },
  { file: "btg_conta.csv",         expectedSource: "btg_conta",       expectedCount: 4, expectedType: "mixed" },
  { file: "xp_cc.csv",             expectedSource: "xp_cc",           expectedCount: 4, expectedType: "despesa" },
  { file: "xp_conta.csv",          expectedSource: "xp_conta",        expectedCount: 4, expectedType: "mixed" },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("=" .repeat(60));
console.log("Finance Friend — Parser Multi-Banco: Testes");
console.log("=".repeat(60));

for (const test of tests) {
  const filePath = path.join(FIXTURES_DIR, test.file);
  const csvContent = fs.readFileSync(filePath, "utf-8");
  const bankName = test.file.replace(".csv", "");

  try {
    const txs = runParserSimple(csvContent, test.file);

    const errors = [];

    // Verificar source
    if (txs.length > 0 && txs[0].source !== test.expectedSource) {
      errors.push(`source: esperado "${test.expectedSource}", got "${txs[0].source}"`);
    }

    // Verificar quantidade
    if (txs.length < test.expectedCount) {
      errors.push(`count: esperado >= ${test.expectedCount}, got ${txs.length}`);
    }

    // Verificar campos obrigatórios em todas as transações
    for (const tx of txs) {
      if (!tx.date) errors.push(`date missing em: ${JSON.stringify(tx)}`);
      if (!tx.description) errors.push(`description missing`);
      if (!tx.amount || isNaN(parseFloat(tx.amount))) errors.push(`amount inválido: ${tx.amount}`);
      if (!tx.type) errors.push(`type missing`);
      if (!tx.month) errors.push(`month missing`);
      if (!tx.userId) errors.push(`userId missing`);
      // Verificar caracteres corrompidos
      if (tx.description && tx.description.includes("\uFFFD")) errors.push(`description tem replacement char: ${tx.description}`);
    }

    // Verificar lógica de tipo (mixed = tem receita e despesa)
    if (test.expectedType === "despesa" && txs.some(t => t.type !== "despesa")) {
      errors.push(`esperado todas despesas, mas há receitas`);
    }

    if (errors.length === 0) {
      console.log(`✓ ${bankName.padEnd(25)} → ${txs.length} txs | source: ${txs[0]?.source || "N/A"}`);
      passed++;
    } else {
      console.log(`✗ ${bankName}`);
      errors.forEach(e => console.log(`  ERROR: ${e}`));
      if (txs.length > 0) {
        console.log(`  Amostra:`, JSON.stringify(txs[0], null, 2));
      }
      failed++;
    }
  } catch (err) {
    console.log(`✗ ${bankName}`);
    console.log(`  EXCEPTION: ${err.message}`);
    if (err.message.includes("não reconhecido")) {
      console.log(`  → Formato não detectado`);
    }
    failed++;
  }
}

console.log("=".repeat(60));
console.log(`Resultado: ${passed} passou, ${failed} falhou`);
console.log("=".repeat(60));

process.exit(failed > 0 ? 1 : 0);

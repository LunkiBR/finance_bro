/**
 * Seed das regras de categorização.
 * Baseado nos dados reais do extrato do Leonardo (Excel "Categorias").
 *
 * Rodar: npx tsx src/db/seed-rules.ts
 */

import { db, categoryRules } from "./index";

const rules = [
  // ── TRANSPORTE ──────────────────────────────────────────────────────────────
  { keyword: "uber", category: "Transporte", type: "despesa" as const, priority: 100 },
  { keyword: "99app", category: "Transporte", type: "despesa" as const, priority: 100 },
  { keyword: "99pop", category: "Transporte", type: "despesa" as const, priority: 100 },
  { keyword: "ifood entrega", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "sem parar", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "veloe", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "autopista", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "pedágio", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "combustível", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "posto", category: "Transporte", type: "despesa" as const, priority: 70 },
  { keyword: "metrô", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "metro sp", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "bilhete único", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "sptrans", category: "Transporte", type: "despesa" as const, priority: 80 },
  { keyword: "latam", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "gol linhas", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "azul linhas", category: "Transporte", type: "despesa" as const, priority: 90 },
  { keyword: "booking", category: "Transporte", type: "despesa" as const, priority: 80 },

  // ── ALIMENTAÇÃO ──────────────────────────────────────────────────────────────
  { keyword: "ifood", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "rappi", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "mcdonalds", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "mc donalds", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "burger king", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "subway", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "starbucks", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "padaria", category: "Alimentação", type: "despesa" as const, priority: 90 },
  { keyword: "restaurante", category: "Alimentação", type: "despesa" as const, priority: 90 },
  { keyword: "lanchonete", category: "Alimentação", type: "despesa" as const, priority: 90 },
  { keyword: "sushi", category: "Alimentação", type: "despesa" as const, priority: 90 },
  { keyword: "pizzaria", category: "Alimentação", type: "despesa" as const, priority: 90 },
  { keyword: "supermercado", category: "Alimentação", type: "despesa" as const, priority: 80 },
  { keyword: "mercado", category: "Alimentação", type: "despesa" as const, priority: 70 },
  { keyword: "hortifruti", category: "Alimentação", type: "despesa" as const, priority: 80 },
  { keyword: "pão de açúcar", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "carrefour", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "extra hiper", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "assai", category: "Alimentação", type: "despesa" as const, priority: 100 },
  { keyword: "atacadão", category: "Alimentação", type: "despesa" as const, priority: 100 },

  // ── SAÚDE ────────────────────────────────────────────────────────────────────
  { keyword: "farmácia", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "drogaria", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "droga raia", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "ultrafarma", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "consulta", category: "Saúde", type: "despesa" as const, priority: 90 },
  { keyword: "médico", category: "Saúde", type: "despesa" as const, priority: 90 },
  { keyword: "hospital", category: "Saúde", type: "despesa" as const, priority: 90 },
  { keyword: "laboratorio", category: "Saúde", type: "despesa" as const, priority: 90 },
  { keyword: "amil", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "unimed", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "hapvida", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "academia", category: "Saúde", type: "despesa" as const, priority: 90 },
  { keyword: "smartfit", category: "Saúde", type: "despesa" as const, priority: 100 },
  { keyword: "bluefit", category: "Saúde", type: "despesa" as const, priority: 100 },

  // ── ASSINATURAS / STREAMING ──────────────────────────────────────────────────
  { keyword: "netflix", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "spotify", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "amazon prime", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "disney", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "hbo max", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "max", category: "Assinaturas", type: "despesa" as const, priority: 80 },
  { keyword: "apple", category: "Assinaturas", type: "despesa" as const, priority: 90 },
  { keyword: "youtube premium", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "chatgpt", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "openai", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "anthropic", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "claude.ai", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "github", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "notion", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "figma", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "vercel", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "hostinger", category: "Assinaturas", type: "despesa" as const, priority: 100 },
  { keyword: "google one", category: "Assinaturas", type: "despesa" as const, priority: 100 },

  // ── ELYTRA (empresa) ─────────────────────────────────────────────────────────
  { keyword: "elytra", category: "Elytra (Empresa)", type: "receita" as const, priority: 100 },

  // ── RECEITAS ─────────────────────────────────────────────────────────────────
  { keyword: "salário", category: "Salário", type: "receita" as const, priority: 100 },
  { keyword: "salario", category: "Salário", type: "receita" as const, priority: 100 },
  { keyword: "pagamento recebido", category: "Receita", type: "receita" as const, priority: 90 },
  { keyword: "transferência recebida", category: "Receita", type: "receita" as const, priority: 80 },
  { keyword: "pix recebido", category: "Receita", type: "receita" as const, priority: 80 },
  { keyword: "ted recebido", category: "Receita", type: "receita" as const, priority: 80 },
  { keyword: "rendimento", category: "Investimentos", type: "receita" as const, priority: 90 },

  // ── INVESTIMENTOS ────────────────────────────────────────────────────────────
  { keyword: "investimento", category: "Investimentos", type: "despesa" as const, priority: 90 },
  { keyword: "tesouro direto", category: "Investimentos", type: "despesa" as const, priority: 100 },
  { keyword: "renda fixa", category: "Investimentos", type: "despesa" as const, priority: 100 },
  { keyword: "criptomoeda", category: "Investimentos", type: "despesa" as const, priority: 90 },
  { keyword: "nuinvest", category: "Investimentos", type: "despesa" as const, priority: 100 },

  // ── MORADIA ──────────────────────────────────────────────────────────────────
  { keyword: "aluguel", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "condomínio", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "iptu", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "energia elétrica", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "enel", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "comgás", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "sabesp", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "internet", category: "Moradia", type: "despesa" as const, priority: 90 },
  { keyword: "vivo", category: "Moradia", type: "despesa" as const, priority: 100 },
  { keyword: "claro", category: "Moradia", type: "despesa" as const, priority: 100 },

  // ── LAZER ────────────────────────────────────────────────────────────────────
  { keyword: "cinema", category: "Lazer", type: "despesa" as const, priority: 100 },
  { keyword: "ingresso", category: "Lazer", type: "despesa" as const, priority: 100 },
  { keyword: "ticketmaster", category: "Lazer", type: "despesa" as const, priority: 100 },
  { keyword: "show", category: "Lazer", type: "despesa" as const, priority: 80 },
  { keyword: "jogo", category: "Lazer", type: "despesa" as const, priority: 80 },
  { keyword: "steam", category: "Lazer", type: "despesa" as const, priority: 100 },
  { keyword: "playstation", category: "Lazer", type: "despesa" as const, priority: 100 },

  // ── VESTUÁRIO ────────────────────────────────────────────────────────────────
  { keyword: "zara", category: "Vestuário", type: "despesa" as const, priority: 100 },
  { keyword: "hm", category: "Vestuário", type: "despesa" as const, priority: 90 },
  { keyword: "renner", category: "Vestuário", type: "despesa" as const, priority: 100 },
  { keyword: "centauro", category: "Vestuário", type: "despesa" as const, priority: 100 },
  { keyword: "adidas", category: "Vestuário", type: "despesa" as const, priority: 100 },
  { keyword: "nike", category: "Vestuário", type: "despesa" as const, priority: 100 },

  // ── EDUCAÇÃO ─────────────────────────────────────────────────────────────────
  { keyword: "udemy", category: "Educação", type: "despesa" as const, priority: 100 },
  { keyword: "coursera", category: "Educação", type: "despesa" as const, priority: 100 },
  { keyword: "alura", category: "Educação", type: "despesa" as const, priority: 100 },
  { keyword: "rocketseat", category: "Educação", type: "despesa" as const, priority: 100 },
  { keyword: "escola", category: "Educação", type: "despesa" as const, priority: 90 },
  { keyword: "faculdade", category: "Educação", type: "despesa" as const, priority: 90 },
  { keyword: "mensalidade", category: "Educação", type: "despesa" as const, priority: 80 },
  { keyword: "livraria", category: "Educação", type: "despesa" as const, priority: 90 },
  { keyword: "amazon kindle", category: "Educação", type: "despesa" as const, priority: 100 },
];

async function main() {
  console.log(`Inserindo ${rules.length} regras de categorização...`);
  await db.delete(categoryRules); // limpa antes de re-seed
  await db.insert(categoryRules).values(rules);
  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});

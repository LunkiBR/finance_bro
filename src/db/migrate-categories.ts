/**
 * Migra transações existentes para o novo sistema de 20 categorias com subcategorias.
 *
 * O que faz:
 * 1. Busca todas as transações existentes
 * 2. Busca as novas regras de categorização e payeeMappings
 * 3. Re-executa a categorização para cada transação
 * 4. Se a categoria mudou, marca como confidence "low" para revisão
 * 5. Loga um resumo da migração
 *
 * Rodar: npx tsx src/db/migrate-categories.ts
 */

import { Pool } from "pg";
import { db } from "./index";
import { transactions, payeeMappings } from "./index";
import { eq } from "drizzle-orm";
import { LEGACY_CATEGORY_MAP, isValidCategory } from "../lib/categories";

interface Rule {
  keyword: string;
  category: string;
  subcategory: string | null;
  type: "receita" | "despesa";
  priority: number;
}

interface PayeeMapping {
  beneficiaryNormalized: string; // Drizzle returns camelCase
  category: string;
  subcategory: string | null;
  confidence: string;
}

function normalizeBeneficiary(beneficiary: string): string {
  if (!beneficiary) return "";
  return beneficiary
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function categorize(
  description: string,
  beneficiary: string,
  amount: string,
  rules: Rule[],
  mappings: PayeeMapping[]
): { category: string; subcategory: string | null; confidence: string } {
  const text = `${description} ${beneficiary}`.toLowerCase();
  const normalizedBen = normalizeBeneficiary(beneficiary);
  const numAmount = Number(amount);
  const type = numAmount < 0 ? "despesa" : "receita";

  // 1. Check payeeMappings first
  if (mappings.length > 0 && normalizedBen) {
    const mapping = mappings.find((m) => m.beneficiaryNormalized === normalizedBen);
    if (mapping) {
      // Normalize confidence: payee_mappings uses 'ai'|'manual', enum needs 'high'|'low'|'manual'
      const conf = mapping.confidence === "manual" ? "manual" : "high";
      return {
        category: mapping.category,
        subcategory: mapping.subcategory,
        confidence: conf,
      };
    }
  }

  // 2. Keyword rules
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sortedRules) {
    if (rule.type !== type) continue;
    if (text.includes(rule.keyword.toLowerCase())) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        confidence: "high",
      };
    }
  }

  // 3. Fallback
  return {
    category: type === "receita" ? "Receita" : "Outros",
    subcategory: null,
    confidence: "low",
  };
}

async function main() {
  console.log("=== Migração de Categorias ===");
  console.log("Buscando dados...");

  // Use raw SQL for category_rules: subcategory column may not exist yet (pending ALTER TABLE)
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const pgClient = await pgPool.connect();
  let rules: Rule[];
  try {
    const colCheck = await pgClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'category_rules' AND column_name = 'subcategory'"
    );
    const hasSubcategory = colCheck.rows.length > 0;

    if (!hasSubcategory) {
      console.warn("⚠  Coluna subcategory ausente em category_rules — regras sem subcategoria.");
    }

    const rulesRes = hasSubcategory
      ? await pgClient.query("SELECT keyword, category, subcategory, type, priority FROM category_rules")
      : await pgClient.query("SELECT keyword, category, NULL as subcategory, type, priority FROM category_rules");

    rules = rulesRes.rows.map(r => ({
      keyword: r.keyword,
      category: r.category,
      subcategory: r.subcategory as string | null,
      type: r.type as "receita" | "despesa",
      priority: Number(r.priority),
    }));
  } finally {
    pgClient.release();
    await pgPool.end();
  }

  const [allTx, mappings] = await Promise.all([
    db.select().from(transactions),
    db.select().from(payeeMappings),
  ]);

  console.log(`Transações: ${allTx.length}`);
  console.log(`Regras: ${rules.length}`);
  console.log(`Mapeamentos: ${mappings.length}`);

  let changed = 0;
  let kept = 0;
  let uncertain = 0;
  let legacyMapped = 0;

  const changes: Array<{
    id: string;
    description: string;
    oldCategory: string;
    newCategory: string;
    newSubcategory: string | null;
  }> = [];

  for (const tx of allTx) {
    const amountForType = tx.type === "despesa" ? `-${tx.amount}` : tx.amount;

    // Try re-categorizing with new rules
    const result = categorize(
      tx.description,
      tx.beneficiary,
      amountForType,
      rules as Rule[],
      mappings as unknown as PayeeMapping[]
    );

    let finalCategory = result.category;
    let finalSubcategory = result.subcategory;
    let confidence = result.confidence;

    // If new rules didn't find a match but old category exists in legacy map, use that
    if (
      finalCategory === "Outros" &&
      tx.category !== "Outros" &&
      !isValidCategory(tx.category) &&
      LEGACY_CATEGORY_MAP[tx.category]
    ) {
      const mapped = LEGACY_CATEGORY_MAP[tx.category];
      finalCategory = mapped.category;
      finalSubcategory = mapped.subcategory || null;
      confidence = "low";
      legacyMapped++;
    }

    // If old category is still valid in new system and rules didn't find something better
    if (
      finalCategory === "Outros" &&
      tx.category !== "Outros" &&
      isValidCategory(tx.category)
    ) {
      finalCategory = tx.category;
      confidence = "low";
    }

    const categoryChanged = finalCategory !== tx.category;
    const subcategoryChanged = finalSubcategory !== tx.subcategory;

    if (categoryChanged || subcategoryChanged) {
      await db
        .update(transactions)
        .set({
          category: finalCategory,
          subcategory: finalSubcategory,
          categoryConfidence: tx.categoryConfidence === "manual" ? "manual" : (confidence as "high" | "low" | "manual"),
        })
        .where(eq(transactions.id, tx.id));

      changed++;
      changes.push({
        id: tx.id,
        description: tx.description.slice(0, 50),
        oldCategory: tx.category,
        newCategory: finalCategory,
        newSubcategory: finalSubcategory,
      });
    } else {
      kept++;
    }

    if (finalCategory === "Outros" || finalCategory === "Dúvida") {
      uncertain++;
    }
  }

  // Summary
  console.log("\n=== Resultado da Migração ===");
  console.log(`Total: ${allTx.length} transações`);
  console.log(`Mantidas: ${kept}`);
  console.log(`Alteradas: ${changed}`);
  console.log(`  - Via regras novas: ${changed - legacyMapped}`);
  console.log(`  - Via mapeamento legado: ${legacyMapped}`);
  console.log(`Incertas (Outros/Dúvida): ${uncertain}`);

  if (changes.length > 0 && changes.length <= 50) {
    console.log("\nDetalhes das mudanças:");
    for (const c of changes) {
      console.log(`  ${c.description} | ${c.oldCategory} → ${c.newCategory}${c.newSubcategory ? ` / ${c.newSubcategory}` : ""}`);
    }
  } else if (changes.length > 50) {
    console.log(`\nMostrando primeiras 50 de ${changes.length} mudanças:`);
    for (const c of changes.slice(0, 50)) {
      console.log(`  ${c.description} | ${c.oldCategory} → ${c.newCategory}${c.newSubcategory ? ` / ${c.newSubcategory}` : ""}`);
    }
  }

  console.log("\nMigração concluída.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});

/**
 * Finance Friend — Funções de Categorias que dependem do DB (server-only)
 *
 * Este arquivo importa o DB e NÃO pode ser importado por client components.
 * Para tipos e helpers client-safe, use categories.ts.
 */

import { db } from "@/db";
import { userCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CATEGORY_TAXONOMY, type MergedCategoryInfo } from "./categories";

// ─── Mapa de ícones default por categoria ────────────────────────────────────

const DEFAULT_ICONS: Record<string, string> = {
  "Moradia": "Home",
  "Alimentação": "Utensils",
  "Transporte": "Car",
  "Contas e Utilidades": "Wifi",
  "Saúde e Bem-Estar": "HeartPulse",
  "Educação": "GraduationCap",
  "Trabalho e Negócios": "Briefcase",
  "Lazer e Entretenimento": "Ticket",
  "Compras e E-commerce": "ShoppingCart",
  "Família e Dependentes": "Users",
  "Assinaturas e Serviços": "PlaySquare",
  "Impostos e Taxas": "Landmark",
  "Dívidas e Crédito": "CreditCard",
  "Investimentos e Patrimônio": "TrendingUp",
  "Poupança e Reservas": "PiggyBank",
  "Transferências Pessoais": "ArrowRightLeft",
  "Receita": "DollarSign",
  "Cartão de Crédito": "CreditCard",
  "Outros": "MoreHorizontal",
  "Dúvida": "HelpCircle",
};

// ─── getMergedTaxonomy ───────────────────────────────────────────────────────

export async function getMergedTaxonomy(userId: string): Promise<Record<string, MergedCategoryInfo>> {
  // 1. Defaults
  const merged: Record<string, MergedCategoryInfo> = {};
  for (const [name, info] of Object.entries(CATEGORY_TAXONOMY)) {
    merged[name] = {
      ...info,
      icon: DEFAULT_ICONS[name] || "MoreHorizontal",
      isCustom: false,
    };
  }

  // 2. Custom do usuário
  const customs = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.userId, userId), eq(userCategories.isActive, true)))
    .orderBy(userCategories.sortOrder);

  for (const c of customs) {
    if (c.parent) {
      // Subcategoria: adiciona ao parent existente
      if (merged[c.parent]) {
        const subName = c.name;
        if (!merged[c.parent].subcategories.includes(subName)) {
          merged[c.parent].subcategories = [...merged[c.parent].subcategories, subName];
        }
      }
    } else if (merged[c.name]) {
      // Override de categoria existente
      merged[c.name] = {
        subcategories: c.subcategories?.length ? c.subcategories : merged[c.name].subcategories,
        color: {
          bg: c.colorBg || merged[c.name].color.bg,
          text: c.colorText || merged[c.name].color.text,
          dot: c.colorDot || merged[c.name].color.dot,
        },
        type: (c.type as "despesa" | "receita" | "ambos") || merged[c.name].type,
        icon: c.icon || merged[c.name].icon,
        aiContext: c.aiContext || undefined,
        aiExamples: c.aiExamples?.length ? c.aiExamples : undefined,
        isCustom: true,
        id: c.id,
      };
    } else {
      // Nova categoria raiz
      merged[c.name] = {
        subcategories: c.subcategories || [],
        color: {
          bg: c.colorBg || "rgba(107,114,128,0.14)",
          text: c.colorText || "#6B7280",
          dot: c.colorDot || "#6B7280",
        },
        type: (c.type as "despesa" | "receita" | "ambos") || "despesa",
        icon: c.icon || "Tag",
        aiContext: c.aiContext || undefined,
        aiExamples: c.aiExamples?.length ? c.aiExamples : undefined,
        isCustom: true,
        id: c.id,
      };
    }
  }

  return merged;
}

// ─── buildCategoryPromptSection ──────────────────────────────────────────────

export function buildCategoryPromptSection(taxonomy: Record<string, MergedCategoryInfo>): string {
  const lines: string[] = ["## Categorias Disponíveis\n"];
  let i = 1;
  for (const [name, info] of Object.entries(taxonomy)) {
    const typeLabel = info.type === "despesa" ? "despesa" : info.type === "receita" ? "receita" : "ambos";
    lines.push(`${i}. **${name}** (${typeLabel}) → ${info.subcategories.join(", ")}`);
    if (info.isCustom && info.aiContext) {
      lines.push(`   _Contexto personalizado: ${info.aiContext}_`);
    }
    if (info.isCustom && info.aiExamples?.length) {
      lines.push(`   _Exemplos no extrato: ${info.aiExamples.join(", ")}_`);
    }
    i++;
  }
  return lines.join("\n");
}

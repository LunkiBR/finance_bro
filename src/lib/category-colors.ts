/**
 * Re-exporta dados de categorias de categories.ts (fonte de verdade).
 * Mantém compatibilidade com imports existentes no projeto.
 */
import {
  CATEGORY_TAXONOMY,
  ALL_CATEGORIES as CATS,
  EXPENSE_CATEGORIES as EXP_CATS,
  CHART_COLORS as COLORS,
  getCategoryColor as getColor,
  LEGACY_CATEGORY_MAP,
} from "./categories";

// Build CATEGORY_COLORS from taxonomy (backward-compatible shape)
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {};
for (const [cat, data] of Object.entries(CATEGORY_TAXONOMY)) {
  CATEGORY_COLORS[cat] = data.color;
}
// Add legacy names for backward-compat during transition
for (const [legacy, mapped] of Object.entries(LEGACY_CATEGORY_MAP)) {
  if (!(legacy in CATEGORY_COLORS) && mapped.category in CATEGORY_COLORS) {
    CATEGORY_COLORS[legacy] = CATEGORY_COLORS[mapped.category];
  }
}

export const CHART_COLORS = COLORS;
export const ALL_CATEGORIES = CATS;
export const EXPENSE_CATEGORIES = EXP_CATS;
export function getCategoryColor(category: string) {
  return getColor(category);
}

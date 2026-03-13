import { db } from "@/db";
import { userCategoryRules, transactions } from "@/db/schema";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import type { UserCategoryRule } from "@/db/schema";

export interface RuleMatch {
  ruleId: string;
  category: string;
  subcategory: string | null;
  matchType: "exact" | "contains";
}

/**
 * Matches a transaction description against user rules.
 * Priority: exact > contains, then by priority column (higher wins).
 */
export async function matchRules(
  userId: string,
  description: string
): Promise<RuleMatch | null> {
  const rules = await db
    .select()
    .from(userCategoryRules)
    .where(eq(userCategoryRules.userId, userId))
    .orderBy(desc(userCategoryRules.priority));

  const descLower = description.toLowerCase().trim();

  // Pass 1: exact matches (highest priority)
  for (const rule of rules) {
    if (rule.matchType === "exact") {
      if (descLower === rule.matchString.toLowerCase().trim()) {
        return {
          ruleId: rule.id,
          category: rule.targetCategory,
          subcategory: rule.targetSubcategory,
          matchType: "exact",
        };
      }
    }
  }

  // Pass 2: contains matches
  for (const rule of rules) {
    if (rule.matchType === "contains") {
      if (descLower.includes(rule.matchString.toLowerCase().trim())) {
        return {
          ruleId: rule.id,
          category: rule.targetCategory,
          subcategory: rule.targetSubcategory,
          matchType: "contains",
        };
      }
    }
  }

  return null;
}

/**
 * Finds recent similar transactions (last 2 weeks) that were manually categorized.
 * Used as "short memory" suggestions when no rule matches.
 */
export async function getSuggestions(
  userId: string,
  description: string
): Promise<{ category: string; subcategory: string | null; count: number }[]> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const cutoff = twoWeeksAgo.toISOString().slice(0, 10);

  // Extract meaningful keywords (first 3 words after cleaning)
  const words = description
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/gi, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);

  if (words.length === 0) return [];

  const likePattern = `%${words.join("%")}%`;

  const results = await db
    .select({
      category: transactions.category,
      subcategory: transactions.subcategory,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.categoryConfidence, "manual"),
        sql`${transactions.date} >= ${cutoff}`,
        ilike(transactions.description, likePattern)
      )
    )
    .groupBy(transactions.category, transactions.subcategory)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(3);

  return results.map((r) => ({
    category: r.category,
    subcategory: r.subcategory,
    count: Number(r.count),
  }));
}

/**
 * Applies a rule to all matching existing transactions.
 * Returns the number of transactions updated.
 */
export async function applyRuleToExisting(
  userId: string,
  rule: UserCategoryRule
): Promise<number> {
  if (rule.matchType === "exact") {
    const result = await db
      .update(transactions)
      .set({
        category: rule.targetCategory,
        subcategory: rule.targetSubcategory,
        categoryConfidence: "high",
      })
      .where(
        and(
          eq(transactions.userId, userId),
          sql`LOWER(TRIM(${transactions.description})) = LOWER(TRIM(${rule.matchString}))`
        )
      )
      .returning({ id: transactions.id });
    return result.length;
  } else {
    const result = await db
      .update(transactions)
      .set({
        category: rule.targetCategory,
        subcategory: rule.targetSubcategory,
        categoryConfidence: "high",
      })
      .where(
        and(
          eq(transactions.userId, userId),
          ilike(transactions.description, `%${rule.matchString}%`)
        )
      )
      .returning({ id: transactions.id });
    return result.length;
  }
}

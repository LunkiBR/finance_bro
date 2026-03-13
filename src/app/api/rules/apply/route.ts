import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userCategoryRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { applyRuleToExisting } from "@/lib/rule-engine";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { ruleId } = await req.json();

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId é obrigatório." }, { status: 400 });
    }

    const [rule] = await db
      .select()
      .from(userCategoryRules)
      .where(and(eq(userCategoryRules.id, ruleId), eq(userCategoryRules.userId, userId)))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: "Regra não encontrada." }, { status: 404 });
    }

    const updated = await applyRuleToExisting(userId, rule);

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Rule apply error:", err);
    return NextResponse.json({ error: "Erro ao aplicar regra." }, { status: 500 });
  }
}

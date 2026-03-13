import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userCategoryRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const rules = await db
    .select()
    .from(userCategoryRules)
    .where(eq(userCategoryRules.userId, userId))
    .orderBy(desc(userCategoryRules.priority), desc(userCategoryRules.createdAt));

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { matchType, matchString, targetCategory, targetSubcategory, priority } = body;

    if (!matchType || !matchString?.trim() || !targetCategory?.trim()) {
      return NextResponse.json(
        { error: "matchType, matchString e targetCategory são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["exact", "contains"].includes(matchType)) {
      return NextResponse.json(
        { error: "matchType deve ser 'exact' ou 'contains'." },
        { status: 400 }
      );
    }

    const [rule] = await db
      .insert(userCategoryRules)
      .values({
        userId,
        matchType,
        matchString: matchString.trim(),
        targetCategory: targetCategory.trim(),
        targetSubcategory: targetSubcategory?.trim() || null,
        priority: priority ?? 0,
      })
      .returning();

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    console.error("Rule creation error:", err);
    return NextResponse.json(
      { error: "Erro ao criar regra." },
      { status: 500 }
    );
  }
}

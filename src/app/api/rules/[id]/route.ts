import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userCategoryRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;
  const { id } = await params;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.matchType) updates.matchType = body.matchType;
    if (body.matchString !== undefined) updates.matchString = body.matchString.trim();
    if (body.targetCategory) updates.targetCategory = body.targetCategory.trim();
    if (body.targetSubcategory !== undefined)
      updates.targetSubcategory = body.targetSubcategory?.trim() || null;
    if (body.priority !== undefined) updates.priority = body.priority;

    await db
      .update(userCategoryRules)
      .set(updates)
      .where(and(eq(userCategoryRules.id, id), eq(userCategoryRules.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Rule update error:", err);
    return NextResponse.json({ error: "Erro ao atualizar regra." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;
  const { id } = await params;

  try {
    await db
      .delete(userCategoryRules)
      .where(and(eq(userCategoryRules.id, id), eq(userCategoryRules.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Rule delete error:", err);
    return NextResponse.json({ error: "Erro ao excluir regra." }, { status: 500 });
  }
}

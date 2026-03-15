import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userCategories, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/categories/[id] — atualizar categoria custom
export async function PUT(req: NextRequest, ctx: Ctx) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;
  const { id } = await ctx.params;

  const body = await req.json() as {
    name?: string;
    type?: string;
    parent?: string | null;
    subcategories?: string[];
    colorBg?: string;
    colorText?: string;
    colorDot?: string;
    icon?: string;
    aiContext?: string;
    aiExamples?: string[];
    sortOrder?: number;
  };

  // Buscar categoria existente (garante ownership)
  const [existing] = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.id, id), eq(userCategories.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  // Se renomeando, atualizar transações existentes
  const oldName = existing.name;
  const newName = body.name?.trim();
  if (newName && newName !== oldName) {
    await db
      .update(transactions)
      .set({ category: newName })
      .where(and(eq(transactions.userId, userId), eq(transactions.category, oldName)));

    // Atualizar subcategoria refs se era subcategoria de outra
    if (existing.parent) {
      await db
        .update(transactions)
        .set({ subcategory: newName })
        .where(and(eq(transactions.userId, userId), eq(transactions.subcategory, oldName)));
    }
  }

  try {
    const [updated] = await db
      .update(userCategories)
      .set({
        ...(newName && { name: newName }),
        ...(body.type && { type: body.type }),
        ...(body.parent !== undefined && { parent: body.parent }),
        ...(body.subcategories && { subcategories: body.subcategories }),
        ...(body.colorBg !== undefined && { colorBg: body.colorBg }),
        ...(body.colorText !== undefined && { colorText: body.colorText }),
        ...(body.colorDot !== undefined && { colorDot: body.colorDot }),
        ...(body.icon && { icon: body.icon }),
        ...(body.aiContext !== undefined && { aiContext: body.aiContext }),
        ...(body.aiExamples && { aiExamples: body.aiExamples }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        updatedAt: new Date(),
      })
      .where(and(eq(userCategories.id, id), eq(userCategories.userId, userId)))
      .returning();

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome." }, { status: 409 });
    }
    console.error("Categories PUT error:", err);
    return NextResponse.json({ error: "Erro ao atualizar categoria." }, { status: 500 });
  }
}

// DELETE /api/categories/[id] — soft-delete (is_active = false)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;
  const { id } = await ctx.params;

  const [updated] = await db
    .update(userCategories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(userCategories.id, id), eq(userCategories.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true, deactivated: updated.name });
}

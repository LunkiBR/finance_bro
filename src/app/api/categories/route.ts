import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userCategories } from "@/db/schema";
import { requireAuth } from "@/lib/auth-guard";
import { getMergedTaxonomy } from "@/lib/categories-server";

// GET /api/categories — retorna taxonomia merged (defaults + custom)
export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const taxonomy = await getMergedTaxonomy(userId);
  return NextResponse.json(taxonomy);
}

// POST /api/categories — criar categoria custom
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const body = await req.json() as {
    name: string;
    type?: string;
    parent?: string | null;
    subcategories?: string[];
    colorBg?: string;
    colorText?: string;
    colorDot?: string;
    icon?: string;
    aiContext?: string;
    aiExamples?: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const validTypes = ["despesa", "receita", "ambos"];
  if (body.type && !validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Tipo inválido. Use: despesa, receita ou ambos." }, { status: 400 });
  }

  try {
    const [created] = await db.insert(userCategories).values({
      userId,
      name: body.name.trim(),
      type: body.type || "despesa",
      parent: body.parent || null,
      subcategories: body.subcategories || [],
      colorBg: body.colorBg || null,
      colorText: body.colorText || null,
      colorDot: body.colorDot || null,
      icon: body.icon || "Tag",
      aiContext: body.aiContext || null,
      aiExamples: body.aiExamples || [],
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome." }, { status: 409 });
    }
    console.error("Categories POST error:", err);
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payeeMappings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(payeeMappings)
      .orderBy(desc(payeeMappings.createdAt));
    return NextResponse.json({ mappings: rows });
  } catch (err) {
    console.error("Payee mappings GET error:", err);
    return NextResponse.json({ error: "Erro ao carregar mapeamentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { beneficiaryNormalized, beneficiaryDisplay, category, subcategory, confidence } = body;

    if (!beneficiaryNormalized || !category) {
      return NextResponse.json({ error: "beneficiaryNormalized e category são obrigatórios." }, { status: 400 });
    }

    await db
      .insert(payeeMappings)
      .values({
        beneficiaryNormalized,
        beneficiaryDisplay: beneficiaryDisplay || null,
        category,
        subcategory: subcategory || null,
        confidence: confidence || "manual",
      })
      .onConflictDoUpdate({
        target: payeeMappings.beneficiaryNormalized,
        set: {
          category,
          subcategory: subcategory || null,
          confidence: confidence || "manual",
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payee mappings POST error:", err);
    return NextResponse.json({ error: "Erro ao salvar mapeamento." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

    await db.delete(payeeMappings).where(eq(payeeMappings.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payee mappings DELETE error:", err);
    return NextResponse.json({ error: "Erro ao deletar mapeamento." }, { status: 500 });
  }
}

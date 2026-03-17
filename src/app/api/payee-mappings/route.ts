import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payeeMappings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encrypt, safeDecrypt, deterministicHash } from "@/lib/encryption";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const rows = await db
      .select()
      .from(payeeMappings)
      .where(eq(payeeMappings.userId, userId))
      .orderBy(desc(payeeMappings.createdAt));
    const decrypted = rows.map(r => ({
      ...r,
      beneficiaryNormalized: safeDecrypt(r.beneficiaryNormalized),
      beneficiaryDisplay: r.beneficiaryDisplay ? safeDecrypt(r.beneficiaryDisplay) : null,
    }));
    return NextResponse.json({ mappings: decrypted });
  } catch (err) {
    console.error("Payee mappings GET error:", err);
    return NextResponse.json({ error: "Erro ao carregar mapeamentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { beneficiaryNormalized, beneficiaryDisplay, category, subcategory, confidence } = body;

    if (!beneficiaryNormalized || !category) {
      return NextResponse.json({ error: "beneficiaryNormalized e category são obrigatórios." }, { status: 400 });
    }

    const hash = deterministicHash(beneficiaryNormalized);

    await db
      .insert(payeeMappings)
      .values({
        userId,
        beneficiaryNormalized: encrypt(beneficiaryNormalized),
        beneficiaryDisplay: beneficiaryDisplay ? encrypt(beneficiaryDisplay) : null,
        beneficiaryHash: hash,
        category,
        subcategory: subcategory || null,
        confidence: confidence || "manual",
      })
      .onConflictDoUpdate({
        target: [payeeMappings.userId, payeeMappings.beneficiaryHash],
        set: {
          category,
          subcategory: subcategory || null,
          confidence: confidence || "manual",
          beneficiaryDisplay: beneficiaryDisplay ? encrypt(beneficiaryDisplay) : null,
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
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

    await db.delete(payeeMappings).where(and(eq(payeeMappings.id, parseInt(id)), eq(payeeMappings.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payee mappings DELETE error:", err);
    return NextResponse.json({ error: "Erro ao deletar mapeamento." }, { status: 500 });
  }
}

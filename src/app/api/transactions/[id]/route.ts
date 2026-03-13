import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, payeeMappings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

function normalizeBeneficiary(raw: string): string {
  return (raw || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .substring(0, 100);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Partial<{
      category: string;
      subcategory: string | null;
      categoryConfidence: "high" | "low" | "manual";
      beneficiary: string;
    }> = {};

    if (body.category) {
      updates.category = body.category;
      updates.categoryConfidence = "manual";
    }
    if (body.subcategory !== undefined) {
      updates.subcategory = body.subcategory;
    }
    if (body.beneficiary !== undefined) {
      updates.beneficiary = body.beneficiary;
    }

    await db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (body.pinPayee && body.category) {
      const [tx] = await db
        .select({ beneficiary: transactions.beneficiary })
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .limit(1);

      if (tx?.beneficiary) {
        const normalized = normalizeBeneficiary(tx.beneficiary);
        await db
          .insert(payeeMappings)
          .values({
            userId,
            beneficiaryNormalized: normalized,
            beneficiaryDisplay: tx.beneficiary,
            category: body.category,
            subcategory: body.subcategory || null,
            confidence: "manual",
          })
          .onConflictDoUpdate({
            target: [payeeMappings.userId, payeeMappings.beneficiaryNormalized],
            set: {
              category: body.category,
              subcategory: body.subcategory || null,
              confidence: "manual",
              updatedAt: new Date(),
            },
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Transaction update error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar transação." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { id } = await params;
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Transaction delete error:", err);
    return NextResponse.json(
      { error: "Erro ao excluir transação." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, payeeMappings } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Partial<{
      category: string;
      subcategory: string;
      categoryConfidence: "high" | "low" | "manual";
    }> = {};

    if (body.category) {
      updates.category = body.category;
      updates.categoryConfidence = "manual";
    }
    if (body.subcategory !== undefined) {
      updates.subcategory = body.subcategory;
    }

    await db.update(transactions).set(updates).where(eq(transactions.id, id));

    // Se pinPayee: true, salva o mapeamento para uso futuro
    if (body.pinPayee && body.category) {
      const [tx] = await db
        .select({ beneficiary: transactions.beneficiary })
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      if (tx?.beneficiary) {
        const normalized = normalizeBeneficiary(tx.beneficiary);
        await db
          .insert(payeeMappings)
          .values({
            beneficiaryNormalized: normalized,
            beneficiaryDisplay: tx.beneficiary,
            category: body.category,
            subcategory: body.subcategory || null,
            confidence: "manual",
          })
          .onConflictDoUpdate({
            target: payeeMappings.beneficiaryNormalized,
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

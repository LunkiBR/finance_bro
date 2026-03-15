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

// POST /api/beneficiary/reclassify — update category for ALL transactions of a beneficiary
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { beneficiary, category } = await req.json();

    if (!beneficiary || !category) {
      return NextResponse.json({ error: "beneficiary and category are required." }, { status: 400 });
    }

    // 1. Update all transactions for this beneficiary
    await db
      .update(transactions)
      .set({ category, categoryConfidence: "manual" })
      .where(and(eq(transactions.userId, userId), eq(transactions.beneficiary, beneficiary)));

    // 2. Upsert payee mapping so future imports get the right category
    const normalized = normalizeBeneficiary(beneficiary);
    await db
      .insert(payeeMappings)
      .values({
        userId,
        beneficiaryNormalized: normalized,
        beneficiaryDisplay: beneficiary,
        category,
        subcategory: null,
        confidence: "manual",
      })
      .onConflictDoUpdate({
        target: [payeeMappings.userId, payeeMappings.beneficiaryNormalized],
        set: {
          category,
          subcategory: null,
          confidence: "manual",
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Beneficiary reclassify error:", err);
    return NextResponse.json({ error: "Erro ao reclassificar." }, { status: 500 });
  }
}

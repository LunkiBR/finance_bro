import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, payeeMappings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encrypt, safeDecrypt, deterministicHash } from "@/lib/encryption";

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

    // Can't use SQL WHERE on encrypted beneficiary — fetch all and filter in JS
    const allTx = await db
      .select({ id: transactions.id, beneficiary: transactions.beneficiary })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const matchingIds = allTx
      .filter(tx => safeDecrypt(tx.beneficiary) === beneficiary)
      .map(tx => tx.id);

    // Update matching transactions by ID
    for (const txId of matchingIds) {
      await db
        .update(transactions)
        .set({ category, categoryConfidence: "manual" })
        .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)));
    }

    // Upsert payee mapping with encryption
    const normalized = normalizeBeneficiary(beneficiary);
    const hash = deterministicHash(normalized);
    await db
      .insert(payeeMappings)
      .values({
        userId,
        beneficiaryNormalized: encrypt(normalized),
        beneficiaryDisplay: encrypt(beneficiary),
        beneficiaryHash: hash,
        category,
        subcategory: null,
        confidence: "manual",
      })
      .onConflictDoUpdate({
        target: [payeeMappings.userId, payeeMappings.beneficiaryHash],
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

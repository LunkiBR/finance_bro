import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { encryptNumber, safeDecryptNumber } from "@/lib/encryption";

export async function DELETE(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    try {
        await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Budget delete error:", err);
        return NextResponse.json({ error: "Erro ao remover orçamento." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const month = req.nextUrl.searchParams.get("month") || "";

    try {
        const conditions = [eq(budgets.userId, userId)];
        if (month) conditions.push(eq(budgets.month, month));

        const rows = await db
            .select()
            .from(budgets)
            .where(and(...conditions));

        // Fetch all expense transactions for the relevant months to compute spent in JS
        const months = [...new Set(rows.map(b => b.month))];
        let allExpenses: { category: string; month: string; amount: string }[] = [];
        if (months.length > 0) {
            const txRows = await db
                .select({
                    category: transactions.category,
                    month: transactions.month,
                    amount: transactions.amount,
                })
                .from(transactions)
                .where(and(
                    eq(transactions.userId, userId),
                    eq(transactions.type, "despesa")
                ));
            allExpenses = txRows.filter(t => months.includes(t.month));
        }

        const enriched = rows.map((b) => {
            // Sum expenses for this budget's category+month in JS
            const spent = allExpenses
                .filter(t => t.category === b.category && t.month === b.month)
                .reduce((s, t) => s + safeDecryptNumber(t.amount), 0);
            const spentRounded = Math.round(spent * 100) / 100;

            const limit = safeDecryptNumber(b.limitAmount);
            return {
                ...b,
                limitAmount: String(limit),
                spentAmount: String(spentRounded),
                spent: spentRounded,
                limit,
                pct: limit > 0 ? Math.round((spentRounded / limit) * 100) : 0,
                txCount: allExpenses.filter(t => t.category === b.category && t.month === b.month).length,
            };
        });

        return NextResponse.json(enriched);
    } catch (err) {
        console.error("Budgets error:", err);
        return NextResponse.json({ error: "Erro ao carregar orçamentos." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const body = await req.json();

        await db.insert(budgets).values({
            userId,
            category: body.category,
            month: body.month,
            limitAmount: encryptNumber(Number(body.limitAmount)),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Budget create error:", err);
        return NextResponse.json({ error: "Erro ao criar orçamento." }, { status: 500 });
    }
}

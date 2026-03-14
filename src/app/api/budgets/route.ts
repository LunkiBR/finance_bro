import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

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

        const enriched = await Promise.all(
            rows.map(async (b) => {
                const [spentResult] = await db
                    .select({
                        total: sql<number>`COALESCE(ROUND(SUM(${transactions.amount}::numeric), 2), 0)`,
                        count: sql<number>`COUNT(*)`,
                    })
                    .from(transactions)
                    .where(
                        and(
                            eq(transactions.userId, userId),
                            eq(transactions.category, b.category),
                            eq(transactions.month, b.month),
                            eq(transactions.type, "despesa")
                        )
                    );

                const spent = spentResult?.total || 0;
                const limit = Number(b.limitAmount);
                return {
                    ...b,
                    spent,
                    limit,
                    pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
                    txCount: spentResult?.count || 0,
                };
            })
        );

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
            limitAmount: body.limitAmount,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Budget create error:", err);
        return NextResponse.json({ error: "Erro ao criar orçamento." }, { status: 500 });
    }
}

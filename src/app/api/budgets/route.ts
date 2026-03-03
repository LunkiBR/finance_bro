import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const month = req.nextUrl.searchParams.get("month") || "";

    try {
        const rows = await db
            .select()
            .from(budgets)
            .where(month ? eq(budgets.month, month) : undefined);

        // Enrich with actual spent from transactions
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
    try {
        const body = await req.json();

        await db.insert(budgets).values({
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

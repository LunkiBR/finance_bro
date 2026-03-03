import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, and, sql, desc, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const month = params.get("month") || "";
    const category = params.get("category") || "";
    const type = params.get("type") as "receita" | "despesa" | "";
    const search = params.get("search") || "";
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "25");
    const offset = (page - 1) * limit;

    try {
        const conditions = [];
        if (month) conditions.push(eq(transactions.month, month));
        if (category) conditions.push(eq(transactions.category, category));
        if (type) conditions.push(eq(transactions.type, type));
        if (search) conditions.push(ilike(transactions.description, `%${search}%`));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, countResult, summaryResult] = await Promise.all([
            db
                .select()
                .from(transactions)
                .where(where)
                .orderBy(desc(transactions.date))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(transactions)
                .where(where),
            db
                .select({
                    type: transactions.type,
                    total: sql<number>`ROUND(SUM(${transactions.amount}::numeric), 2)`,
                    count: sql<number>`COUNT(*)`,
                })
                .from(transactions)
                .where(where)
                .groupBy(transactions.type),
        ]);

        const total = countResult[0]?.count || 0;
        const receitas = summaryResult.find((r) => r.type === "receita")?.total || 0;
        const despesas = summaryResult.find((r) => r.type === "despesa")?.total || 0;

        return NextResponse.json({
            transactions: rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            summary: { receitas, despesas, saldo: receitas - despesas, count: total },
        });
    } catch (err) {
        console.error("Transactions error:", err);
        return NextResponse.json({ error: "Erro ao carregar transações." }, { status: 500 });
    }
}

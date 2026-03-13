import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, and, sql, desc, asc, ilike, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

const ALLOWED_SORT_COLS = ["date", "description", "beneficiary", "category", "amount"] as const;
type SortCol = (typeof ALLOWED_SORT_COLS)[number];

export async function GET(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const params = req.nextUrl.searchParams;
    const month = params.get("month") || "";
    const category = params.get("category") || "";
    const type = params.get("type") as "receita" | "despesa" | "";
    const search = params.get("search") || "";
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "25");
    const offset = (page - 1) * limit;

    const sortByRaw = params.get("sortBy") || "date";
    const sortBy: SortCol = ALLOWED_SORT_COLS.includes(sortByRaw as SortCol) ? (sortByRaw as SortCol) : "date";
    const sortDir = params.get("sortDir") === "asc" ? "asc" : "desc";

    const minAmount = params.get("minAmount");
    const maxAmount = params.get("maxAmount");
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");

    try {
        const conditions = [eq(transactions.userId, userId)];
        if (month && !startDate && !endDate) conditions.push(eq(transactions.month, month));
        if (category) conditions.push(eq(transactions.category, category));
        if (type) conditions.push(eq(transactions.type, type));
        if (search) conditions.push(ilike(transactions.description, `%${search}%`));
        if (minAmount) conditions.push(gte(sql`${transactions.amount}::numeric`, Number(minAmount)));
        if (maxAmount) conditions.push(lte(sql`${transactions.amount}::numeric`, Number(maxAmount)));
        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const where = and(...conditions);

        const sortColExpr = sortBy === "amount"
            ? sql`${transactions.amount}::numeric`
            : sortBy === "date" ? transactions.date
            : sortBy === "description" ? transactions.description
            : sortBy === "beneficiary" ? transactions.beneficiary
            : transactions.category;

        const orderExpr = sortDir === "asc" ? asc(sortColExpr) : desc(sortColExpr);

        const [rows, countResult, summaryResult] = await Promise.all([
            db
                .select()
                .from(transactions)
                .where(where)
                .orderBy(orderExpr)
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
        const receitas = Number(summaryResult.find((r) => r.type === "receita")?.total ?? 0);
        const despesas = Number(summaryResult.find((r) => r.type === "despesa")?.total ?? 0);
        const saldo = Math.round((receitas - despesas) * 100) / 100;

        return NextResponse.json({
            transactions: rows,
            pagination: { page, limit, total, totalPages: Math.ceil(Number(total) / limit) },
            summary: { receitas, despesas, saldo, count: Number(total) },
        });
    } catch (err) {
        console.error("Transactions error:", err);
        return NextResponse.json({ error: "Erro ao carregar transações." }, { status: 500 });
    }
}

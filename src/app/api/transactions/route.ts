import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { safeDecrypt, safeDecryptNumber } from "@/lib/encryption";

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

    const sortByRaw = params.get("sortBy") || "date";
    const sortDir = params.get("sortDir") === "asc" ? "asc" : "desc";

    const minAmount = params.get("minAmount") ? Number(params.get("minAmount")) : null;
    const maxAmount = params.get("maxAmount") ? Number(params.get("maxAmount")) : null;
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");

    try {
        // Fetch with non-encrypted filters only
        const conditions = [eq(transactions.userId, userId)];
        if (month && !startDate && !endDate) conditions.push(eq(transactions.month, month));
        if (category) conditions.push(eq(transactions.category, category));
        if (type) conditions.push(eq(transactions.type, type));
        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const rows = await db
            .select()
            .from(transactions)
            .where(and(...conditions))
            .orderBy(sortDir === "asc" ? asc(transactions.date) : desc(transactions.date));

        // Decrypt all rows
        const decrypted = rows.map(r => ({
            ...r,
            description: safeDecrypt(r.description),
            beneficiary: safeDecrypt(r.beneficiary),
            amount: safeDecryptNumber(r.amount),
        }));

        // Apply encrypted-field filters in JS
        let filtered = decrypted;
        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(r =>
                r.description.toLowerCase().includes(s) ||
                r.beneficiary.toLowerCase().includes(s)
            );
        }
        if (minAmount !== null) filtered = filtered.filter(r => r.amount >= minAmount);
        if (maxAmount !== null) filtered = filtered.filter(r => r.amount <= maxAmount);

        // Sort by encrypted fields in JS
        const validSorts = ["date", "description", "beneficiary", "category", "amount"];
        const sortBy = validSorts.includes(sortByRaw) ? sortByRaw : "date";
        if (sortBy !== "date") {
            filtered.sort((a, b) => {
                const aVal = a[sortBy as keyof typeof a];
                const bVal = b[sortBy as keyof typeof b];
                if (typeof aVal === "number" && typeof bVal === "number") {
                    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
                }
                const cmp = String(aVal).localeCompare(String(bVal));
                return sortDir === "asc" ? cmp : -cmp;
            });
        }

        // Summary from filtered data
        const receitas = filtered.filter(r => r.type === "receita").reduce((s, r) => s + r.amount, 0);
        const despesas = filtered.filter(r => r.type === "despesa").reduce((s, r) => s + r.amount, 0);
        const saldo = Math.round((receitas - despesas) * 100) / 100;
        const total = filtered.length;

        // Paginate
        const offset = (page - 1) * limit;
        const paginated = filtered.slice(offset, offset + limit);

        // Return amount as string for frontend compatibility
        const txOut = paginated.map(r => ({ ...r, amount: String(r.amount) }));

        return NextResponse.json({
            transactions: txOut,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            summary: { receitas: Math.round(receitas * 100) / 100, despesas: Math.round(despesas * 100) / 100, saldo, count: total },
        });
    } catch (err) {
        console.error("Transactions error:", err);
        return NextResponse.json({ error: "Erro ao carregar transações." }, { status: 500 });
    }
}

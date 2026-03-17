import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiSummaries, transactions, budgets, goals, userProfile } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";
import { genai } from "@/lib/claude";
import { getCurrentMonth, formatBRL } from "@/lib/utils";
import { encrypt, safeDecrypt, safeDecryptNumber } from "@/lib/encryption";

// GET — dashboard fetches the latest AI summary for the user
export async function GET(_req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const [row] = await db
            .select()
            .from(aiSummaries)
            .where(eq(aiSummaries.userId, userId))
            .orderBy(desc(aiSummaries.generatedAt))
            .limit(1);

        if (!row) return NextResponse.json({ content: null });
        return NextResponse.json({ content: safeDecrypt(row.content), month: row.month, generatedAt: row.generatedAt });
    } catch (err) {
        console.error("AI summary GET error:", err);
        return NextResponse.json({ content: null });
    }
}

// POST — n8n triggers this after import (webhook auth) to generate + save summary
export async function POST(req: NextRequest) {
    const webhookSecret = process.env.ALERTS_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get("x-webhook-secret");

    if (!webhookSecret || incomingSecret !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { userId: string; month?: string; generateFromDB?: boolean; content?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { userId, generateFromDB = true } = body;
    const month = body.month || getCurrentMonth();

    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    try {
        let content: string;

        if (generateFromDB || !body.content) {
            content = await generateAISummary(userId, month);
        } else {
            content = body.content;
        }

        // Upsert: delete previous + insert new (encrypt content)
        await db.delete(aiSummaries).where(eq(aiSummaries.userId, userId));
        await db.insert(aiSummaries).values({ userId, content: encrypt(content), month });

        return NextResponse.json({ success: true, content });
    } catch (err) {
        console.error("AI summary POST error:", err);
        return NextResponse.json({ error: "Erro ao gerar síntese." }, { status: 500 });
    }
}

async function generateAISummary(userId: string, month: string): Promise<string> {
    // Fetch raw data and decrypt in JS
    const [txRows, budgetRows, goalRows, profileRows] = await Promise.all([
        db.select().from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.month, month))),
        db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.month, month))),
        db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))).limit(3),
        db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1),
    ]);

    // Decrypt and aggregate
    const decTx = txRows.map(t => ({
        type: t.type,
        amount: safeDecryptNumber(t.amount),
        category: t.category,
    }));

    const receitas = decTx.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const despesas = decTx.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    const saldo = receitas - despesas;

    // Top 3 expense categories
    const catMap: Record<string, number> = {};
    for (const t of decTx.filter(t => t.type === "despesa")) {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }
    const top3 = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat, total]) => `${cat}: R$ ${formatBRL(total)}`)
        .join(", ");

    const overBudget = budgetRows
        .filter(b => safeDecryptNumber(b.spentAmount) >= safeDecryptNumber(b.limitAmount))
        .map(b => b.category);

    const decGoals = goalRows.map(g => ({
        name: safeDecrypt(g.name),
        current: safeDecryptNumber(g.currentAmount),
        target: safeDecryptNumber(g.targetAmount),
    }));
    const nearGoal = decGoals.sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];

    const userName = profileRows[0]?.nome ? safeDecrypt(profileRows[0].nome) : "você";

    const prompt = `Você é o Finance Friend, um assistente financeiro pessoal direto e prático.
Gere UMA frase de síntese executiva para o usuário ${userName} referente ao mês ${month}.

Dados financeiros:
- Receitas: R$ ${formatBRL(receitas)}
- Despesas: R$ ${formatBRL(despesas)}
- Saldo: R$ ${formatBRL(saldo)} (${saldo < 0 ? "NEGATIVO" : "positivo"})
- Top categorias de gasto: ${top3 || "sem dados"}
- Orçamentos estourados: ${overBudget.length > 0 ? overBudget.join(", ") : "nenhum"}
- Meta mais próxima: ${nearGoal ? `${nearGoal.name} (${Math.round((nearGoal.current / nearGoal.target) * 100)}% concluída)` : "nenhuma ativa"}

Formato obrigatório: 1-2 frases, direta, pessoal, com número concreto E uma ação específica.
Exemplo: "Você tem R$ 450 livres para gastar esta semana. Segure os gastos com Vestuário (maior categoria) para não comprometer a meta do HB20."
Se o saldo for negativo: comece com "Atenção: seu saldo está em R$ X negativos este mês."
Responda APENAS com as frases, sem prefixo nem explicação.`;

    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

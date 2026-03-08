import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    try {
        const body = await req.json();

        await db.insert(userProfile).values({
            userId,
            nome: body.nome,
            rendaMensal: body.rendaMensal || null,
            dividaMensal: body.dividaMensal || null,
            bancoPrincipal: body.bancoPrincipal || null,
            objetivoPrincipal: body.objetivoPrincipal || null,
            temReserva: body.temReserva || null,
            categoriasAltas: body.categoriasAltas || [],
            onboardingCompleto: true,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Onboarding error:", err);
        return NextResponse.json(
            { error: "Erro ao salvar perfil." },
            { status: 500 }
        );
    }
}

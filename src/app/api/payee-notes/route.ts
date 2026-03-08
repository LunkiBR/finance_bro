import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payeeNotes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const rows = await db
      .select()
      .from(payeeNotes)
      .where(eq(payeeNotes.userId, userId))
      .orderBy(desc(payeeNotes.createdAt));
    return NextResponse.json({ notes: rows });
  } catch (err) {
    console.error("Payee notes GET error:", err);
    return NextResponse.json({ error: "Erro ao carregar notas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { note } = await req.json();
    if (!note?.trim()) {
      return NextResponse.json({ error: "note é obrigatório." }, { status: 400 });
    }
    const [inserted] = await db.insert(payeeNotes).values({ userId, note: note.trim() }).returning();
    return NextResponse.json({ note: inserted });
  } catch (err) {
    console.error("Payee notes POST error:", err);
    return NextResponse.json({ error: "Erro ao salvar nota." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

    await db.delete(payeeNotes).where(and(eq(payeeNotes.id, parseInt(id)), eq(payeeNotes.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payee notes DELETE error:", err);
    return NextResponse.json({ error: "Erro ao deletar nota." }, { status: 500 });
  }
}

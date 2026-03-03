import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payeeNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(payeeNotes)
      .orderBy(desc(payeeNotes.createdAt));
    return NextResponse.json({ notes: rows });
  } catch (err) {
    console.error("Payee notes GET error:", err);
    return NextResponse.json({ error: "Erro ao carregar notas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { note } = await req.json();
    if (!note?.trim()) {
      return NextResponse.json({ error: "note é obrigatório." }, { status: 400 });
    }
    const [inserted] = await db.insert(payeeNotes).values({ note: note.trim() }).returning();
    return NextResponse.json({ note: inserted });
  } catch (err) {
    console.error("Payee notes POST error:", err);
    return NextResponse.json({ error: "Erro ao salvar nota." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

    await db.delete(payeeNotes).where(eq(payeeNotes.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payee notes DELETE error:", err);
    return NextResponse.json({ error: "Erro ao deletar nota." }, { status: 500 });
  }
}

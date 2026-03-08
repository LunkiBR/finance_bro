import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { role } = authResult;
  if (role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const { id } = await params;
  const { username, email, name, role: newRole, password } = (await req.json()) as {
    username?: string;
    email?: string;
    name?: string;
    role?: string;
    password?: string;
  };

  // Uniqueness check excluding this user
  const conditions = [];
  if (username?.trim()) conditions.push(eq(users.username, username.trim()));
  if (email?.trim()) conditions.push(eq(users.email, email.trim().toLowerCase()));
  if (conditions.length > 0) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(or(...conditions), ne(users.id, id)))
      .limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Username ou email já em uso." }, { status: 409 });
    }
  }

  if (password && password.length < 8) {
    return Response.json({ error: "Senha deve ter no mínimo 8 caracteres." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name?.trim() || null;
  if (username?.trim()) updates.username = username.trim();
  if (email?.trim()) updates.email = email.trim().toLowerCase();
  if (newRole === "admin" || newRole === "user") updates.role = newRole;
  if (password?.trim()) updates.passwordHash = await bcrypt.hash(password, 12);

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  if (!updated) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId, role } = authResult;
  if (role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const { id } = await params;
  if (id === userId) {
    return Response.json({ error: "Você não pode deletar sua própria conta." }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, id));
  return Response.json({ success: true });
}

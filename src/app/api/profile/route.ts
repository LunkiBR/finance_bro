import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  return Response.json(user);
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { userId } = authResult;

  const { name, username, email, avatarUrl, currentPassword, newPassword } = (await req.json()) as {
    name?: string;
    username?: string;
    email?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  };

  // Uniqueness check excluding current user
  const conditions = [];
  if (username?.trim()) conditions.push(eq(users.username, username.trim()));
  if (email?.trim()) conditions.push(eq(users.email, email.trim().toLowerCase()));
  if (conditions.length > 0) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(or(...conditions), ne(users.id, userId)))
      .limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Username ou email já em uso." }, { status: 409 });
    }
  }

  // Password change validation
  if (newPassword) {
    if (!currentPassword) {
      return Response.json({ error: "Informe a senha atual para alterar a senha." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "Nova senha deve ter no mínimo 8 caracteres." }, { status: 400 });
    }

    const [currentUser] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
    if (!valid) return Response.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name?.trim() || null;
  if (username?.trim()) updates.username = username.trim();
  if (email?.trim()) updates.email = email.trim().toLowerCase();
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 12);

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
    });

  if (!updated) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  return Response.json(updated);
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { role } = authResult;
  if (role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const list = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return Response.json(list);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const { role } = authResult;
  if (role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const { username, email, password, name, role: newRole } = (await req.json()) as {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  };

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return Response.json({ error: "username, email e password são obrigatórios." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Senha deve ter no mínimo 8 caracteres." }, { status: 400 });
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username.trim()), eq(users.email, email.trim().toLowerCase())))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ error: "Username ou email já em uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name?.trim() || null,
      role: newRole === "admin" ? "admin" : "user",
      status: "active" as const,
    })
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    });

  return Response.json(newUser, { status: 201 });
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { auth } from "@/auth";

// POST /api/auth/register
// Admin-only: requires an active session with role="admin"
// (Set ALLOW_REGISTER=true in .env to allow open registration)
export async function POST(req: NextRequest) {
  try {
    const allowRegister = process.env.ALLOW_REGISTER === "true";

    if (!allowRegister) {
      const session = await auth();
      if (!session?.user || (session.user as { role?: string }).role !== "admin") {
        return Response.json(
          { error: "Registro é restrito a administradores." },
          { status: 403 }
        );
      }
    }

    const { username, email, password, name } = await req.json() as {
      username?: string;
      email?: string;
      password?: string;
      name?: string;
    };

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return Response.json(
        { error: "username, email e password são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "Username ou email já em uso." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name?.trim() || null,
        role: "user",
      })
      .returning({ id: users.id, username: users.username, email: users.email });

    return Response.json({ success: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Erro ao criar usuário." }, { status: 500 });
  }
}

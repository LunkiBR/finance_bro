import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

// POST /api/auth/register — public, creates user with status='pending'
// Admin must approve before user can log in
export async function POST(req: NextRequest) {
  try {
    const { username, email, password, name, avatarUrl } = await req.json() as {
      username?: string;
      email?: string;
      password?: string;
      name?: string;
      avatarUrl?: string;
    };

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return Response.json(
        { error: "username, email e password são obrigatórios." },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric + underscore only)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
      return Response.json(
        { error: "Username deve ter 3-30 caracteres: letras, números e _ apenas." },
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
      .where(or(eq(users.username, username.trim()), eq(users.email, email.trim().toLowerCase())))
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
        status: "pending",
        avatarUrl: avatarUrl || null,
      })
      .returning({ id: users.id, username: users.username, email: users.email, status: users.status });

    return Response.json({ success: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Erro ao criar usuário." }, { status: 500 });
  }
}

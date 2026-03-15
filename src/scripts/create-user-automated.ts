import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { parseArgs } from "util";
import dotenv from "dotenv";
import path from "path";

// Carregar .env.local manualmente pois o comando de shell falhou
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
    console.log("--- Criar Usuário (Debug) ---");
    console.log("CWD:", process.cwd());
    console.log("DATABASE_URL carregada:", process.env.DATABASE_URL ? "Sim" : "Não");

    const { values } = parseArgs({
        options: {
            username: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
            password: { type: "string" },
        },
    });

    const { username, email, name, password } = values;

    if (!username || !email || !password) {
        console.error("Erro: Username, Email e Senha são obrigatórios.");
        process.exit(1);
    }

    try {
        const existing = await db
            .select()
            .from(users)
            .where(or(eq(users.username, username), eq(users.email, email)))
            .limit(1);

        if (existing.length > 0) {
            console.error("Erro: Username ou Email já estão em uso.");
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [newUser] = await db
            .insert(users)
            .values({
                username,
                email,
                name: name || null,
                passwordHash,
                role: "user",
            })
            .returning();

        console.log(`✅ Usuário criado: ${newUser.username} (${newUser.email})`);
    } catch (error) {
        console.error("❌ Erro:", error);
        process.exit(1);
    }
    process.exit(0);
}

main();

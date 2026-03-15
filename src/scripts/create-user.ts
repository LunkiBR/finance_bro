import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("--- Criar Novo Usuário (Finance Friend) ---");

    const username = (await question("Username: ")).trim();
    const email = (await question("Email: ")).trim().toLowerCase();
    const name = (await question("Nome (opcional): ")).trim();
    const password = await question("Senha (mínimo 8 caracteres): ");

    if (!username || !email || !password) {
        console.error("Erro: Username, Email e Senha são obrigatórios.");
        process.exit(1);
    }

    if (password.length < 8) {
        console.error("Erro: A senha deve ter no mínimo 8 caracteres.");
        process.exit(1);
    }

    try {
        // Verificar se já existe
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

        console.log("\n✅ Usuário criado com sucesso!");
        console.log(`ID: ${newUser.id}`);
        console.log(`Username: ${newUser.username}`);
        console.log(`Email: ${newUser.email}`);
    } catch (error) {
        console.error("\n❌ Erro ao criar usuário:", error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

main();

import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function create() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    const username = "bruno";
    const email = "brunoaramosa@gmail.com";
    const name = "Bruno";
    const password = "Brunoeleonardo1";

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const query = `
      INSERT INTO ff_users (username, email, name, password_hash, role)
      VALUES ($1, $2, $3, $4, 'user')
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username;
    `;
        const res = await pool.query(query, [username, email, name, passwordHash]);

        if (res.rows.length > 0) {
            console.log("✅ Usuário criado com sucesso:", res.rows[0]);
        } else {
            console.log("⚠️ Usuário já existe ou conflito detectado.");
        }
    } catch (err) {
        console.error("❌ Erro ao criar usuário:", err);
    } finally {
        await pool.end();
    }
}

create();

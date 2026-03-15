import pg from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    try {
        const res = await pool.query("SELECT NOW()");
        console.log("Sucesso! DB Time:", res.rows[0]);
    } catch (err) {
        console.error("Erro Conexão:", err);
    } finally {
        await pool.end();
    }
}

test();

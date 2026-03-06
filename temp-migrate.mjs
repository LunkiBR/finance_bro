import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        await pool.query('ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS ai_notes TEXT');
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

main();

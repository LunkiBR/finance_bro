import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reutiliza a pool de conexões entre chamadas (importante para serverless/Vercel)
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 60000,        // aumentado de 30000
      connectionTimeoutMillis: 30000,  // aumentado de 5000
      statement_timeout: 30000,
    });
  }
  return global._pgPool;
}

export const db = drizzle(getPool(), { schema });
export * from "./schema";

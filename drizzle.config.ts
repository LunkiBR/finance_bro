import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Carrega especificamente o .env.local
dotenv.config({ path: '.env.local' });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only manage ff_ prefixed tables — prevents touching other projects' tables on the same DB
  tablesFilter: ["ff_*"],
} satisfies Config;

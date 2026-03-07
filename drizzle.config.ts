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
  // Exclude third-party views that cause drizzle-kit schema parsing errors
  tablesFilter: ["!feedback_with_chunks"],
} satisfies Config;

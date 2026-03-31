import * as dotenv from "dotenv";

// 🔴 explicitly tell dotenv to load .env.local
dotenv.config({ path: ".env.local" });

import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
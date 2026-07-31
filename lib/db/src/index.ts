import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Force UTC for every connection's session timezone. Schema columns use
// `timestamp` (no tz), so `now()`/`defaultNow()` cast to the session's local
// wall-clock on write; without this, a non-UTC DB server timezone silently
// skews every stored timestamp relative to Node's UTC-based `Date`.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: "-c timezone=UTC" });
export const db = drizzle(pool, { schema });

export * from "./schema";

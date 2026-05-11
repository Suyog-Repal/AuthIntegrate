import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Support for Supabase connection pooling (using port 5432 for direct connection if 6543 is provided)
const connectionString = process.env.DATABASE_URL.replace("6543", "5432");

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export { pool };

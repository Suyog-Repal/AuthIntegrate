// Migration runner script
// This script connects to the database and runs the password reset migration

import { db } from "./server/db.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log("🔄 Running password reset migration...");

    // Read the migration SQL file
    const migrationPath = join(__dirname, "migrations", "001_add_password_reset.sql");
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Split by semicolon to run each statement separately
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith("--"));

    // Execute each statement
    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
      await db.query(statement);
      console.log("✅ Success");
    }

    console.log("✅ Migration completed successfully!");
    console.log("📝 Columns added:");
    console.log("   - reset_token (VARCHAR 255)");
    console.log("   - reset_token_expiry (TIMESTAMP)");
    console.log("📊 Indexes created:");
    console.log("   - idx_reset_token");
    console.log("   - idx_reset_token_expiry");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();

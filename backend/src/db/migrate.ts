import { pool } from "./index.js";

async function run() {
  console.log("⏳ Starting database migrations...");
  const client = await pool.connect();
  try {
    console.log("✅ Connected to database!");
    
    // Create Enums
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE access_result AS ENUM ('GRANTED', 'DENIED', 'REGISTERED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "finger_id" integer NOT NULL UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "access_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
        "result" access_result NOT NULL,
        "note" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "mobile" varchar(20),
        "password_hash" text NOT NULL,
        "reset_token" varchar(255),
        "reset_token_expiry" timestamp,
        "role" user_role DEFAULT 'user' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("✨ Tables created/verified successfully!");
    
    // Optional: Seed initial admin or test data if needed
    const res = await client.query(`SELECT COUNT(*) FROM users;`);
    if (res.rows[0].count === "0") {
       console.log("🌱 Seeding initial hardware users...");
       await client.query(`INSERT INTO users (finger_id) VALUES (1), (2), (99);`);
       console.log("✅ Seeded users.");
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    client.release();
    // Do not call pool.end() if this is imported elsewhere, 
    // but since this is a standalone migration script:
    await pool.end();
    console.log("👋 Migration process finished.");
  }
}

run().catch(console.error);

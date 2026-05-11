import { pool } from "./src/config/database.js";

async function run() {
  const client = await pool.connect();
  try {
    console.log("Connected to DB!");
    await client.query(`
      CREATE TYPE access_result AS ENUM ('GRANTED', 'DENIED', 'REGISTERED');
    `).catch(e => console.log(e.message));

    await client.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'user');
    `).catch(e => console.log(e.message));

    // Clean up old schema
    await client.query(`
      DROP TABLE IF EXISTS "access_logs" CASCADE;
      DROP TABLE IF EXISTS "user_profiles" CASCADE;
      DROP TABLE IF EXISTS "hardware_users" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
    `).catch(e => console.log(e.message));

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

    console.log("Tables created successfully!");
    
    // Seed test data
    const res = await client.query(`SELECT COUNT(*) FROM users;`);
    if (res.rows[0].count === "0") {
       await client.query(`INSERT INTO users (finger_id) VALUES (1), (2), (99);`);
       console.log("Seeded users.");
    }
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    client.release();
    pool.end();
  }
}

run();

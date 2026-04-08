import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = await mysql.createPool({
  host: process.env.DB_HOST || "authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASS || "authintegrate123",
  database: process.env.DB_NAME || "authintegrate",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
await db.query("SET time_zone = '+05:30'");
console.log("✅ Connected to MySQL successfully!");
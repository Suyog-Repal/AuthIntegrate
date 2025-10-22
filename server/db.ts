import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Suyog@4398sql", // change if needed
  database: process.env.DB_NAME || "authintegrate",
  connectionLimit: 10,
});

console.log("✅ Connected to MySQL successfully!");

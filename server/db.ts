import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASS || "authintegrate123",
  database: process.env.DB_NAME || "authintegrate",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 🔥 FIX: Add connection timeout (default 10 seconds → 5 seconds for faster failure)
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,
  connectTimeout: 5000,
  waitForConnectionsMillis: 5000,
};

let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function createConnectionPool() {
  try {
    connectionAttempts++;
    console.log(`🔄 Attempting database connection (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS})...`);
    console.log(`   Host: ${dbConfig.host}`);
    
    const pool = await mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    await connection.query("SET time_zone = '+05:30'");
    connection.release();
    
    console.log("✅ Connected to MySQL successfully!");
    return pool;
  } catch (error: any) {
    console.error(`\n❌ Database connection failed (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, error.message);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`⏳ Retrying in ${RETRY_DELAY}ms...\n`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createConnectionPool();
    } else {
      console.error("\n" + "=".repeat(70));
      console.error("⚠️  CRITICAL: Cannot connect to database after multiple attempts!");
      console.error("=".repeat(70));
      console.error("\n📍 For development, please follow these steps:\n");
      console.error("1️⃣  START MYSQL SERVICE:");
      console.error("   Windows: Open 'Services' → Search 'MySQL' → Right-click → Start");
      console.error("   Or: Run 'net start MySQL94' in Admin Command Prompt\n");
      console.error("2️⃣  SETUP LOCAL DATABASE:");
      console.error("   Open: DATABASE_SETUP.md file in the project root");
      console.error("   Follow the 'Quick Setup' section\n");
      console.error("3️⃣  UPDATE .env FILE (in project root):");
      console.error("   DB_HOST=localhost");
      console.error("   DB_USER=admin");
      console.error("   DB_PASS=authintegrate123\n");
      console.error("4️⃣  RUN DATABASE SETUP:");
      console.error("   mysql -u root -p < setup-local-db.sql\n");
      console.error("5️⃣  START APP:");
      console.error("   npm run dev\n");
      console.error("=".repeat(70));
      console.error("\n🌐 OR use AWS RDS for production:");
      console.error("   DB_HOST=your-rds-endpoint.rds.amazonaws.com");
      console.error("   DB_USER=your_admin_user");
      console.error("   DB_PASS=your_strong_password\n");
      console.error("=".repeat(70) + "\n");
      throw new Error("Failed to connect to database after multiple retries");
    }
  }
}

// Initialize database connection
export const db = await createConnectionPool();
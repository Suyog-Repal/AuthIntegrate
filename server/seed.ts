import { db } from "./db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    const users = [
      { id: 1, fingerId: 101, password: "000000" },
      { id: 2, fingerId: 102, password: "000000" },
      { id: 3, fingerId: 103, password: "000000" },
    ];

    // Insert users (hardware records)
    for (const user of users) {
      await db.query(
        "INSERT IGNORE INTO users (id, finger_id, password) VALUES (?, ?, ?)", 
        [user.id, user.fingerId, user.password]
      );
    }

    const profiles = [
      {
        userId: 1,
        email: "admin@example.com",
        mobile: "9999999999",
        passwordHash: await bcrypt.hash("123456", 10),
        role: "admin",
      },
      {
        userId: 2,
        email: "user@example.com",
        mobile: "8888888888",
        passwordHash: await bcrypt.hash("654321", 10),
        role: "user",
      },
    ];

    // Insert user profiles (web app records)
    for (const p of profiles) {
      await db.query(
        `INSERT IGNORE INTO user_profiles (user_id, email, mobile, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
        [p.userId, p.email, p.mobile, p.passwordHash, p.role]
      );
    }
    
    console.log("✅ Seeded users and profiles successfully!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }
}

seed().then(() => process.exit(0));
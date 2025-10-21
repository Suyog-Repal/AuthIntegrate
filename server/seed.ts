import { db } from "./db";
import { users, userProfiles, accessLogs } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create hardware users
    const hardwareUsers = [
      { id: 1, fingerId: 101, password: "1234" },
      { id: 2, fingerId: 102, password: "5678" },
      { id: 3, fingerId: 103, password: "9012" },
    ];

    for (const user of hardwareUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    console.log("✓ Hardware users created");

    // Create user profiles
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const userPasswordHash = await bcrypt.hash("user123", 10);

    const profiles = [
      {
        userId: 1,
        email: "admin@example.com",
        mobile: "+1 (555) 123-4567",
        passwordHash: adminPasswordHash,
        role: "admin" as const,
      },
      {
        userId: 2,
        email: "user@example.com",
        mobile: "+1 (555) 987-6543",
        passwordHash: userPasswordHash,
        role: "user" as const,
      },
    ];

    for (const profile of profiles) {
      await db.insert(userProfiles).values(profile).onConflictDoNothing();
    }
    console.log("✓ User profiles created");
    console.log("  Admin: admin@example.com / admin123");
    console.log("  User: user@example.com / user123");

    // Create sample access logs
    const logs = [
      { userId: 1, result: "GRANTED" as const, note: "Hardware fingerprint authentication" },
      { userId: 2, result: "GRANTED" as const, note: "Hardware fingerprint authentication" },
      { userId: 1, result: "GRANTED" as const, note: "Morning access" },
      { userId: 2, result: "DENIED" as const, note: "Invalid fingerprint" },
      { userId: 1, result: "GRANTED" as const, note: "Afternoon access" },
      { userId: 3, result: "REGISTERED" as const, note: "New fingerprint registered" },
    ];

    for (const log of logs) {
      await db.insert(accessLogs).values(log);
    }
    console.log("✓ Sample access logs created");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

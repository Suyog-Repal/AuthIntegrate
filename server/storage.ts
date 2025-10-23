import { db } from "./db";
import bcrypt from "bcryptjs";
import type { UserProfile, User, InsertUserProfile } from "@shared/schema";

// Helper function to extract the first row and its fields, then maps to UserWithProfile
function mapToUserWithProfile(row: any) {
  if (!row) return null;
  const user: User = {
    id: row.id,
    fingerId: row.finger_id,
    password: row.password,
    createdAt: row.created_at,
  };
  const profile: UserProfile | null = row.email
    ? {
        id: row.profile_id,
        userId: row.user_id,
        // === Change: Added name mapping ===
        name: row.name, 
        // ==================================
        email: row.email,
        mobile: row.mobile,
        password_hash: row.password_hash,
        role: row.role,
        createdAt: row.profile_created_at,
      }
    : null;

  return { ...user, profile };
}

class DatabaseStorage {
  // =============== USERS (HARDWARE) ==================
  async getUser(id: number): Promise<User | null> {
    const [rows]: any = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  }
  async createUser(data: { id: number; fingerId: number; password: string }) {
    await db.query("INSERT INTO users (id, finger_id, password) VALUES (?, ?, ?)", [
      data.id,
      data.fingerId,
      data.password,
    ]);
  }
  async deleteUser(id: number) {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
  }
  async getAllUsersWithProfiles() {
    const [rows]: any = await db.query(`
      SELECT
          u.id, u.finger_id, u.password, u.created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, p.created_at as profile_created_at,
          p.name  -- === Change: Added name select ===
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.id
    `);
    return rows.map((row: any) => ({
      id: row.id,
      fingerId: row.finger_id,
      password: row.password,
      createdAt: row.created_at,
      profile: row.profile_id
        ? {
            id: row.profile_id,
            userId: row.user_id,
            email: row.email,
            mobile: row.mobile,
            password_hash: row.password_hash,
            role: row.role,
            createdAt: row.profile_created_at,
            // === Change: Added name mapping ===
            name: row.name, 
            // ==================================
          }
        : null,
    }));
  }
  async getUserWithProfile(userId: number) {
    const [rows]: any = await db.query(
      `SELECT
          u.id, u.finger_id, u.password, u.created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, p.created_at as profile_created_at,
          p.name  -- === Change: Added name select ===
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?`,
      [userId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      fingerId: row.finger_id,
      password: row.password,
      createdAt: row.created_at,
      profile: row.profile_id
        ? {
            id: row.profile_id,
            userId: row.user_id,
            email: row.email,
            mobile: row.mobile,
            password_hash: row.password_hash,
            role: row.role,
            createdAt: row.profile_created_at,
            // === Change: Added name mapping ===
            name: row.name, 
            // ==================================
          }
        : null,
    };
  }

  // =============== USER PROFILES (WEB) ==================

  async getUserProfileByUserId(userId: number) {
    const [rows]: any = await db.query("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
    return rows[0] || null;
  }

  async getUserProfileByEmail(email: string) {
    const [rows]: any = await db.query("SELECT * FROM user_profiles WHERE email = ?", [email]);
    return rows[0] || null;
  }

  async createUserProfile(profile: Omit<InsertUserProfile, 'password'> & { passwordHash: string }) {
    await db.query(
      `INSERT INTO user_profiles (user_id, name, email, mobile, password_hash, role)  -- === Change: Added name column ===
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        profile.userId,
        profile.name, // === Change: Added profile.name value ===
        profile.email,
        profile.mobile || null,
        profile.passwordHash,
        profile.role || "user",
      ]
    );
  }

  // =============== ACCESS LOGS ==================
  async createAccessLog(data: { userId: number; result: string; note?: string }) {
    await db.query(
      `INSERT INTO access_logs (user_id, result, note, created_at)
       VALUES (?, ?, ?, NOW())`,
      [data.userId, data.result, data.note || null]
    );
  }
  async getRecentAccessLogs(limit = 50) {
    const [rows]: any = await db.query(
      `SELECT
            l.id,
            l.user_id AS userId,
            l.result,
            l.note,
            l.created_at AS createdAt,
            p.email,
            p.mobile,
            p.name AS userName -- === Change: Added userName select ===
        FROM access_logs l
        LEFT JOIN user_profiles p ON l.user_id = p.user_id
        ORDER BY l.created_at DESC
        LIMIT ?`,
      [limit]
    );
    return rows;
  }
  async getUserAccessLogs(userId: number) {
    const [rows]: any = await db.query(
      `SELECT
           l.id,
           l.user_id AS userId,
           l.result,
           l.note,
           l.created_at AS createdAt,
           p.email,
           p.mobile,
           p.name AS userName -- === Change: Added userName select ===
        FROM access_logs l
        LEFT JOIN user_profiles p ON l.user_id = p.user_id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // FIXED: Added checks for array indexing and simplified to safely access the total property.
  async getSystemStats() {
    // MySQL query returns [[rows], [fields]]
    const [userCountRows]: any = await db.query("SELECT COUNT(*) AS total FROM users");
    const [logCountRows]: any = await db.query("SELECT COUNT(*) AS total FROM access_logs");
    const [todayStatsRows]: any = await db.query(`
        SELECT
            SUM(CASE WHEN result = 'GRANTED' AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS accessGrantedToday,
            SUM(CASE WHEN result = 'DENIED' AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS accessDeniedToday
        FROM access_logs
    `);

    // Safely get the total count. Check if the result array exists and has elements.
    const totalUsers = userCountRows && userCountRows.length > 0 ? userCountRows[0].total : 0;
    const totalAccessLogs = logCountRows && logCountRows.length > 0 ? logCountRows[0].total : 0;

    // The aggregation functions (SUM) will always return one row, even if values are NULL/0
    const todayStats = todayStatsRows && todayStatsRows.length > 0 ? todayStatsRows[0] : {};

    return {
      totalUsers: totalUsers,
      totalAccessLogs: totalAccessLogs,
      accessGrantedToday: todayStats.accessGrantedToday || 0,
      accessDeniedToday: todayStats.accessDeniedToday || 0,
    };
  }
}

export const storage = new DatabaseStorage();
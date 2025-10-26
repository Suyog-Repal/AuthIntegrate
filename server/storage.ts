// server/storage.ts
import { db } from "./db";
import bcrypt from "bcryptjs";
import type { User, UserProfile, InsertUserProfile } from "@shared/schema";

class DatabaseStorage {
  // --- Standard functions omitted for brevity ---
  async getUser(id: number): Promise<any> {
    const [rows]: any = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  }
  async createUser(data: { id: number; fingerId: number; password?: string }) {
    await db.query("INSERT INTO users (id, finger_id) VALUES (?, ?)", [
      data.id,
      data.fingerId,
    ]);
  }
  async deleteUser(id: number) {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
  }
  async getAllUsersWithProfiles(): Promise<any[]> {
    const [rows]: any = await db.query(`
      SELECT
          u.id, u.finger_id, u.created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, p.created_at as profile_created_at, p.name
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.id
    `);
    return rows.map((row: any) => ({
      id: row.id,
      fingerId: row.finger_id,
      createdAt: row.created_at,
      profile: row.profile_id ? {
        id: row.profile_id,
        userId: row.user_id,
        email: row.email,
        mobile: row.mobile,
        password_hash: row.password_hash,
        role: row.role,
        createdAt: row.profile_created_at,
        name: row.name,
      } : null,
    }));
  }
  async getUserWithProfile(userId: number): Promise<any> {
    const [rows]: any = await db.query(
      `SELECT
          u.id, u.finger_id, u.created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, p.created_at as profile_created_at, p.name
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
      createdAt: row.created_at,
      profile: row.profile_id ?
      {
        id: row.profile_id,
        userId: row.user_id,
        email: row.email,
        mobile: row.mobile,
        password_hash: row.password_hash,
        role: row.role,
        createdAt: row.profile_created_at,
        name: row.name,
      } : null,
    };
  }
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
      `INSERT INTO user_profiles (user_id, name, email, mobile, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [profile.userId, profile.name, profile.email, profile.mobile || null, profile.passwordHash, profile.role || "user"]
    );
  }
  async updateUserProfile(userId: number, data: { name: string, email: string, mobile?: string, role: 'admin' | 'user' }) {
    await db.query(
      `UPDATE user_profiles
       SET name = ?, email = ?, mobile = ?, role = ?
       WHERE user_id = ?`,
      [data.name, data.email, data.mobile || null, data.role, userId]
    );
  }
  async createAccessLog(data: { userId: number; result: string; note?: string }) {
    await db.query(
      `INSERT INTO access_logs (user_id, result, note, created_at)
       VALUES (?, ?, ?, NOW())`,
      [data.userId, data.result, data.note || null]
    );
  }
  async getRecentAccessLogs(limit = 50): Promise<any[]> {
    const [rows]: any = await db.query(
      `SELECT
            l.id,
           l.user_id AS userId,
           l.result,
           l.note,
           l.created_at AS createdAt,
           p.email,
           p.mobile,
           p.name AS name
         FROM access_logs l
        LEFT JOIN user_profiles p ON l.user_id = p.user_id
        ORDER BY l.created_at DESC
        LIMIT ?`,
      [limit]
    );
    return rows;
  }
  
  // 🔥 FINAL FIX: Ensure strict retrieval for the user dashboard.
  async getUserAccessLogs(userId: number): Promise<any[]> {
    const [rows]: any = await db.query(
      `SELECT
           l.id,
           l.user_id AS userId,
           l.result,
           l.note,
           l.created_at AS createdAt,
           p.email,
           p.mobile,
           p.name AS name
        FROM access_logs l
        LEFT JOIN user_profiles p ON l.user_id = p.user_id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC`,
      [userId]
    );
    // CRITICAL: Ensure we return the raw rows. If the DB says 200 but returns empty,
    // the logs must not exist for that user ID in the access_logs table.
    return rows;
  }

  async getSystemStats() {
    const [userCountRows]: any = await db.query(`
        SELECT COUNT(p.user_id) AS totalUsers
         FROM user_profiles p
    `);
    const [logCountRows]: any = await db.query("SELECT COUNT(*) AS total FROM access_logs");
    const [todayStatsRows]: any = await db.query(`
        SELECT
            SUM(CASE WHEN result = 'GRANTED' AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS accessGrantedToday,
            SUM(CASE WHEN result = 'DENIED' AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS accessDeniedToday
        FROM access_logs
    `);
    const totalUsers = userCountRows && userCountRows.length > 0 ? userCountRows[0].totalUsers : 0;
    const totalAccessLogs = logCountRows && logCountRows.length > 0 ? logCountRows[0].total : 0;
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
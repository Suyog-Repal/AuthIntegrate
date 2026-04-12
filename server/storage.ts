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
          u.id, u.finger_id, CONVERT_TZ(u.created_at, '+00:00', '+05:30') AS created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, CONVERT_TZ(p.created_at, '+00:00', '+05:30') as profile_created_at, p.name
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
          u.id, u.finger_id, CONVERT_TZ(u.created_at, '+00:00', '+05:30') AS created_at,
          p.id as profile_id, p.user_id, p.email, p.mobile, p.role, p.password_hash, CONVERT_TZ(p.created_at, '+00:00', '+05:30') as profile_created_at, p.name
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
    const [rows]: any = await db.query(`
      SELECT id, user_id, email, mobile, role, password_hash, CONVERT_TZ(created_at, '+00:00', '+05:30') AS created_at, name, reset_token, reset_token_expiry 
      FROM user_profiles WHERE user_id = ?
    `, [userId]);
    return rows[0] || null;
  }
  async getUserProfileByEmail(email: string) {
    const [rows]: any = await db.query(`
      SELECT id, user_id, email, mobile, role, password_hash, CONVERT_TZ(created_at, '+00:00', '+05:30') AS created_at, name, reset_token, reset_token_expiry 
      FROM user_profiles WHERE email = ?
    `, [email]);
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
           CONVERT_TZ(l.created_at, '+00:00', '+05:30') AS createdAt,
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
           CONVERT_TZ(l.created_at, '+00:00', '+05:30') AS createdAt,
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

  // 🔥 PHASE 2: Enhanced filtering for logs with support for date, month, year, status, userId, and time range
  async getAccessLogsWithFilters(filters: {
    date?: string; // YYYY-MM-DD
    month?: number; // 1-12
    year?: number; // YYYY
    status?: 'GRANTED' | 'DENIED' | 'REGISTERED';
    userId?: number;
    startTime?: string; // HH:MM:SS
    endTime?: string; // HH:MM:SS
    searchTerm?: string; // For searching by name or email
    limit?: number;
  }): Promise<any[]> {
    let query = `
      SELECT
        l.id,
        l.user_id AS userId,
        l.result,
        l.note,
        CONVERT_TZ(l.created_at, '+00:00', '+05:30') AS createdAt,
        p.email,
        p.mobile,
        p.name
      FROM access_logs l
      LEFT JOIN user_profiles p ON l.user_id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Date filter (exact date in IST)
    if (filters.date) {
      // ✅ EXPLICIT IST: Compare IST dates only
      query += ` AND DATE(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) = STR_TO_DATE(?, '%Y-%m-%d')`;
      params.push(filters.date);
    }

    // Month filter (in IST year)
    if (filters.month !== undefined && filters.month >= 1 && filters.month <= 12) {
      // ✅ EXPLICIT IST: Filter by IST month
      query += ` AND MONTH(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) = ?`;
      params.push(filters.month);
    }

    // Year filter (in IST)
    if (filters.year) {
      // ✅ EXPLICIT IST: Filter by IST year
      query += ` AND YEAR(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) = ?`;
      params.push(filters.year);
    }

    // Status filter
    if (filters.status) {
      query += ` AND l.result = ?`;
      params.push(filters.status);
    }

    // User ID filter
    if (filters.userId) {
      query += ` AND l.user_id = ?`;
      params.push(filters.userId);
    }

    // Time range filter (in IST)
    if (filters.startTime) {
      // ✅ EXPLICIT IST: Filter by IST time
      query += ` AND TIME(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) >= STR_TO_TIME(?)`;
      params.push(filters.startTime);
    }
    if (filters.endTime) {
      // ✅ EXPLICIT IST: Filter by IST time
      query += ` AND TIME(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) <= STR_TO_TIME(?)`;
      params.push(filters.endTime);
    }

    // Search filter (by name or email)
    if (filters.searchTerm) {
      query += ` AND (p.name LIKE ? OR p.email LIKE ?)`;
      const searchPattern = `%${filters.searchTerm}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY l.created_at DESC`;
    
    const limit = filters.limit || 100;
    query += ` LIMIT ?`;
    params.push(limit);

    const [rows]: any = await db.query(query, params);
    return rows;
  }

  async getSystemStats() {
    const [userCountRows]: any = await db.query(`
        SELECT COUNT(p.user_id) AS totalUsers
         FROM user_profiles p
    `);
    const [logCountRows]: any = await db.query("SELECT COUNT(*) AS total FROM access_logs");
    
    // ✅ CRITICAL FIX: Use explicit IST date comparison for accuracy
    // Both sides must use the same timezone: CONVERT_TZ(timestamp, '+00:00', '+05:30')
    // This ensures "today" means IST date, not UTC date
    const [todayStatsRows]: any = await db.query(`
        SELECT
            SUM(CASE WHEN result = 'GRANTED' AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')) THEN 1 ELSE 0 END) AS accessGrantedToday,
            SUM(CASE WHEN result = 'DENIED' AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')) THEN 1 ELSE 0 END) AS accessDeniedToday
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

  // ==================== PASSWORD RESET METHODS ====================
  async saveResetToken(userId: number, token: string, expiryMinutes: number = 15): Promise<void> {
    console.log(`💾 Saving reset token for user ${userId}, expiry: ${expiryMinutes} minutes`);
    
    // ✅ CRITICAL FIX: Let MySQL calculate expiry using NOW() to avoid timezone issues
    // Instead of: JavaScript Date → MySQL (timezone conversion issues)
    // Do: MySQL NOW() + INTERVAL → guaranteed to be in server timezone
    await db.query(
      `UPDATE user_profiles 
       SET reset_token = ?, 
           reset_token_expiry = DATE_ADD(NOW(), INTERVAL ? MINUTE)
       WHERE user_id = ?`,
      [token, expiryMinutes, userId]
    );
    
    console.log(`   ✅ Token saved successfully`);
    console.log(`   📌 Expiry calculated by MySQL using NOW() + INTERVAL ${expiryMinutes} MINUTE`);
  }

  async getUserByResetToken(token: string): Promise<any | null> {
    console.log(`🔎 Querying database for reset token: ${token.substring(0, 10)}...`);
    
    // ✅ CRITICAL: MySQL handles time comparison, not JavaScript
    // This avoids ALL timezone issues because NOW() is always in MySQL's timezone
    const [rows]: any = await db.query(
      `SELECT * FROM user_profiles 
       WHERE reset_token = ? 
       AND reset_token_expiry > NOW()`,
      [token]
    );
    
    if (rows && rows.length > 0) {
      console.log(`   ✅ Token validated! User ID: ${rows[0].user_id}`);
      return rows[0];
    } else {
      console.log(`   ❌ Token not found or expired`);
      
      // Debug: Check if token exists but is expired (timezone debugging)
      const [debugRows]: any = await db.query(
        `SELECT user_id, reset_token, reset_token_expiry, NOW() as current_db_time
         FROM user_profiles 
         WHERE reset_token = ?`,
        [token]
      );
      
      if (debugRows && debugRows.length > 0) {
        const row = debugRows[0];
        console.log(`   📌 Token EXISTS but EXPIRED or INVALID:`);
        console.log(`      Token in DB: ${row.reset_token ? "YES" : "NO"}`);
        console.log(`      Expiry time: ${row.reset_token_expiry}`);
        console.log(`      Current DB time: ${row.current_db_time}`);
        console.log(`      Status: ${new Date(row.reset_token_expiry).getTime() > new Date(row.current_db_time).getTime() ? "Should be valid (time OK)" : "EXPIRED"}`);
      } else {
        console.log(`   📌 Token does NOT exist in database`);
      }
      
      return null;
    }
  }

  async clearResetToken(userId: number): Promise<void> {
    console.log(`🗑️  Clearing reset token for user ${userId}`);
    
    await db.query(
      `UPDATE user_profiles 
       SET reset_token = NULL, reset_token_expiry = NULL 
       WHERE user_id = ?`,
      [userId]
    );
    
    console.log(`   ✅ Token cleared successfully`);
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await db.query(
      `UPDATE user_profiles SET password_hash = ? WHERE user_id = ?`,
      [passwordHash, userId]
    );
  }
}

export const storage = new DatabaseStorage();
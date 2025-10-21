import {
  users,
  userProfiles,
  accessLogs,
  type User,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type AccessLog,
  type InsertAccessLog,
  type UserWithProfile,
  type AccessLogWithUser,
  type SystemStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserWithProfile(id: number): Promise<UserWithProfile | undefined>;
  getAllUsersWithProfiles(): Promise<UserWithProfile[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // User profile operations
  getUserProfileByEmail(email: string): Promise<UserProfile | undefined>;
  getUserProfileByUserId(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: Omit<InsertUserProfile, "role"> & { role?: "admin" | "user"; passwordHash: string }): Promise<UserProfile>;
  
  // Access log operations
  getAllAccessLogs(): Promise<AccessLogWithUser[]>;
  getRecentAccessLogs(limit: number): Promise<AccessLogWithUser[]>;
  getUserAccessLogs(userId: number): Promise<AccessLogWithUser[]>;
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;
  
  // Stats
  getSystemStats(): Promise<SystemStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserWithProfile(id: number): Promise<UserWithProfile | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, id));
    
    if (!user) return undefined;
    
    return {
      ...user.users,
      profile: user.user_profiles || null,
    };
  }

  async getAllUsersWithProfiles(): Promise<UserWithProfile[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(users.createdAt));
    
    return result.map(row => ({
      ...row.users,
      profile: row.user_profiles || null,
    }));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, email));
    return profile || undefined;
  }

  async getUserProfileByUserId(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: Omit<InsertUserProfile, "role"> & { role?: "admin" | "user"; passwordHash: string }): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async getAllAccessLogs(): Promise<AccessLogWithUser[]> {
    const result = await db
      .select()
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .orderBy(desc(accessLogs.createdAt))
      .limit(100);
    
    return result.map(row => ({
      ...row.access_logs,
      user: row.users || null,
    }));
  }

  async getRecentAccessLogs(limit: number): Promise<AccessLogWithUser[]> {
    const result = await db
      .select()
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .orderBy(desc(accessLogs.createdAt))
      .limit(limit);
    
    return result.map(row => ({
      ...row.access_logs,
      user: row.users || null,
    }));
  }

  async getUserAccessLogs(userId: number): Promise<AccessLogWithUser[]> {
    const result = await db
      .select()
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .where(eq(accessLogs.userId, userId))
      .orderBy(desc(accessLogs.createdAt));
    
    return result.map(row => ({
      ...row.access_logs,
      user: row.users || null,
    }));
  }

  async createAccessLog(log: InsertAccessLog): Promise<AccessLog> {
    const [newLog] = await db
      .insert(accessLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getSystemStats(): Promise<SystemStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [logCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accessLogs);

    const [grantedToday] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.result, "GRANTED"),
          gte(accessLogs.createdAt, startOfToday)
        )
      );

    const [deniedToday] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.result, "DENIED"),
          gte(accessLogs.createdAt, startOfToday)
        )
      );

    return {
      totalUsers: userCount?.count || 0,
      totalAccessLogs: logCount?.count || 0,
      accessGrantedToday: grantedToday?.count || 0,
      accessDeniedToday: deniedToday?.count || 0,
      hardwareConnected: false, // Will be set by hardware service
    };
  }
}

export const storage = new DatabaseStorage();

import { db } from "../config/database";
import { accessLogs, userProfiles, users } from "@shared/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

export class LogService {
  async getRecentLogs(limit = 50) {
    return await db.query.accessLogs.findMany({
      with: {
        user: {
          with: {
            profile: true,
          },
        },
      },
      orderBy: [desc(accessLogs.createdAt)],
      limit,
    });
  }

  async getLogsWithFilters(filters: any) {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(accessLogs.userId, filters.userId));
    }

    if (filters.status) {
      conditions.push(eq(accessLogs.result, filters.status));
    }

    if (filters.date) {
      // Filter by date (ignoring time)
      conditions.push(sql`DATE(${accessLogs.createdAt}) = ${filters.date}`);
    }

    // More filters can be added here...

    const logs = await db.query.accessLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          with: {
            profile: true,
          },
        },
      },
      orderBy: [desc(accessLogs.createdAt)],
      limit: filters.limit || 100,
    });

    return logs.map(log => ({
      ...log,
      name: log.user?.profile?.name,
      email: log.user?.profile?.email,
      mobile: log.user?.profile?.mobile,
      created_at_ist: log.createdAt, // Frontend will handle formatting
    }));
  }

  async getUserLogs(userId: number) {
    return await db.query.accessLogs.findMany({
      where: eq(accessLogs.userId, userId),
      orderBy: [desc(accessLogs.createdAt)],
    });
  }

  async getSystemStats() {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(userProfiles);
    const totalAccessLogs = await db.select({ count: sql<number>`count(*)` }).from(accessLogs);
    
    // Stats for today (IST)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await db.select({
      granted: sql<number>`SUM(CASE WHEN ${accessLogs.result} = 'GRANTED' THEN 1 ELSE 0 END)`,
      denied: sql<number>`SUM(CASE WHEN ${accessLogs.result} = 'DENIED' THEN 1 ELSE 0 END)`,
    }).from(accessLogs).where(gte(accessLogs.createdAt, today));

    return {
      totalUsers: Number(totalUsers[0].count),
      totalAccessLogs: Number(totalAccessLogs[0].count),
      accessGrantedToday: Number(todayStats[0].granted || 0),
      accessDeniedToday: Number(todayStats[0].denied || 0),
    };
  }

  async createLog(data: any) {
    return await db.insert(accessLogs).values(data).returning();
  }
}

export const logService = new LogService();

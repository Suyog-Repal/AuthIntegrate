import { sql } from "drizzle-orm";
import { pgTable, integer, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accessResultEnum = pgEnum("access_result", ["GRANTED", "DENIED", "REGISTERED"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

// Hardware users table (from ESP32)
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  fingerId: integer("finger_id").notNull().unique(),
  password: varchar("password", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Access logs from hardware
export const accessLogs = pgTable("access_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  result: accessResultEnum("result").notNull(),
  note: varchar("note", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Web user profiles
export const userProfiles = pgTable("user_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accessLogs: many(accessLogs),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Extended types for API responses
export type UserWithProfile = User & {
  profile: UserProfile | null;
};

export type AccessLogWithUser = AccessLog & {
  user: User | null;
};

export type SystemStats = {
  totalUsers: number;
  totalAccessLogs: number;
  accessGrantedToday: number;
  accessDeniedToday: number;
  hardwareConnected: boolean;
};

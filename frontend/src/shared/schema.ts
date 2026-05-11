import { z } from "zod";

// ========================
// ENUM TYPES
// ========================
export type AccessResult = "GRANTED" | "DENIED" | "REGISTERED";
export type UserRole = "admin" | "user";

// ========================
// VALIDATION SCHEMAS
// ========================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserProfileSchema = z.object({
  userId: z.number().int().min(0, "User ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  mobile: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

export const hardwareVerifySchema = z.object({
  userId: z.number().int().min(0),
  password: z.string().min(1),
});

// ========================
// TYPE DEFINITIONS
// ========================
export type User = {
  id: number;
  fingerId: number;
  createdAt: Date;
};

export type AccessLog = {
  id: number;
  userId: number | null;
  result: AccessResult;
  note: string | null;
  createdAt: Date;
};

export type UserProfile = {
  id: number;
  userId: number;
  name: string;
  email: string;
  mobile: string | null;
  passwordHash: string;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  role: UserRole;
  createdAt: Date;
};

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// ========================
// EXTENDED TYPES
// ========================
export type UserWithProfile = User & {
  profile: UserProfile | null;
};

export type AccessLogWithUser = AccessLog & {
  user: User | null;
  name?: string;
  email?: string;
  mobile?: string;
  created_at_ist?: string | Date;
};

export type SystemStats = {
  totalUsers: number;
  totalAccessLogs: number;
  accessGrantedToday: number;
  accessDeniedToday: number;
  hardwareConnected: boolean;
};


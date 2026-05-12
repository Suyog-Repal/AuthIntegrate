import bcrypt from "bcryptjs";

const isDev = process.env.NODE_ENV !== "production";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { userProfiles, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authConfig } from "../config/auth.js";
import { randomBytes } from "crypto";
import { emailService } from "./email.service.js";

export interface RegisterData {
  userId: number;
  password: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.fingerId, data.userId),
    });

    if (!existingUser) {
      throw new Error("User not found. Please ensure fingerprint registration first.");
    }

    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, existingUser.id),
    });

    if (existingProfile) {
      throw new Error("Profile already exists for this User ID");
    }

    const passwordHash = await bcrypt.hash(data.password, authConfig.saltRounds);

    const [newProfile] = await db.insert(userProfiles).values({
      userId: existingUser.id,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      passwordHash,
      role: data.role || "user",
    } as any).returning();

    const emailSent = await emailService.sendRegistrationEmail({
      email: data.email,
      name: data.name,
      userId: data.userId,
    });

    if (!emailSent) {
      console.warn(`[REGISTRATION] Failed to send welcome email to ${data.email}`);
    }

    return newProfile;
  }

  async login(email: string, password: string) {
    if (isDev) console.log(`[DEBUG] Login attempt`);
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (!profile) {
      if (isDev) console.log(`[DEBUG] Login failed: user not found`);
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, profile.passwordHash);
    if (!isValid) {
      if (isDev) console.log(`[DEBUG] Login failed: password mismatch`);
      throw new Error("Invalid credentials");
    }

    if (isDev) console.log(`[DEBUG] Login successful. Generating JWT...`);

    const token = jwt.sign(
      { userId: profile.userId, role: profile.role },
      authConfig.jwtSecret as string,
      { expiresIn: authConfig.jwtExpiresIn } as any
    );

    return { token, profile };
  }

  async forgotPassword(email: string) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (!profile) {
      throw new Error("This email address does not match with our database.");
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.update(userProfiles)
      .set({ resetToken, resetTokenExpiry: expiry })
      .where(eq(userProfiles.userId, profile.userId));

    const frontendUrl = process.env.FRONTEND_URL || "https://auth-integrate.vercel.app";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH] Generated reset link for ${profile.email}: ${resetLink}`);
    }

    const emailSent = await emailService.sendPasswordResetEmail({
      email: profile.email,
      name: profile.name,
      resetLink,
      expiryMinutes: 15,
    });

    if (!emailSent) {
      console.error(`[AUTH] Failed to send reset email to ${profile.email}`);
      throw new Error("Failed to send password reset email. Please try again later.");
    }

    console.log(`[AUTH] Password reset email sent successfully to ${profile.email}`);
    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH] Attempting to reset password with token: ${token.substring(0, 8)}...`);
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.resetToken, token),
    });

    if (!profile) {
      console.warn(`[AUTH] Password reset failed: Token not found or invalid`);
      throw new Error("Invalid or expired reset token");
    }

    if (!profile.resetTokenExpiry || profile.resetTokenExpiry < new Date()) {
      console.warn(`[AUTH] Password reset failed: Token expired for user ${profile.email}`);
      throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, authConfig.saltRounds);

    await db.update(userProfiles)
      .set({ 
        passwordHash, 
        resetToken: null, 
        resetTokenExpiry: null 
      })
      .where(eq(userProfiles.userId, profile.userId));

    console.log(`[AUTH] Password reset successful for user: ${profile.email}`);
    return true;
  }

  async verifyHardware(userId: number, password: string | number) {
    const user = await db.query.users.findFirst({
      where: eq(users.fingerId, userId),
    });

    if (!user) {
      throw new Error("User ID not fully registered");
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      throw new Error("User ID not fully registered");
    }

    const isValid = await bcrypt.compare(String(password), profile.passwordHash);
    if (!isValid) {
      throw new Error("Password does not match");
    }

    return true;
  }

  async getMe(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      throw new Error("Profile not found");
    }

    return user;
  }
}

export const authService = new AuthService();

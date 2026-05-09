import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { userProfiles, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "../config/auth";
import { randomBytes } from "crypto";
import { emailService } from "./email.service";

export class AuthService {
  async register(data: any) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, data.userId),
    });

    if (!existingUser) {
      throw new Error("User not found in hardware database. Please ensure fingerprint registration first.");
    }

    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, data.userId),
    });

    if (existingProfile) {
      throw new Error("Profile already exists for this User ID");
    }

    const passwordHash = await bcrypt.hash(data.password, authConfig.saltRounds);

    const [newProfile] = await db.insert(userProfiles).values({
      userId: data.userId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      passwordHash,
      role: data.role || "user",
    }).returning();

    await emailService.sendRegistrationEmail({
      email: data.email,
      name: data.name,
      userId: data.userId,
    });

    return newProfile;
  }

  async login(email: string, password: string) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (!profile) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, profile.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { userId: profile.userId, role: profile.role },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
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

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail({
      email: profile.email,
      name: profile.name,
      resetLink,
      expiryMinutes: 15,
    });

    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.resetToken, token),
    });

    if (!profile || !profile.resetTokenExpiry || profile.resetTokenExpiry < new Date()) {
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

    return true;
  }
}

export const authService = new AuthService();

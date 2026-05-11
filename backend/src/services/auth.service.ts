import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { userProfiles, users } from "../shared_schema";
import { eq } from "drizzle-orm";
import { authConfig } from "../config/auth";
import { randomBytes } from "crypto";
import { emailService } from "./email.service";

export class AuthService {
  async register(data: any) {
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
    }).returning();

    await emailService.sendRegistrationEmail({
      email: data.email,
      name: data.name,
      userId: data.userId,
    });

    return newProfile;
  }

  async login(email: string, password: string) {
    console.log(`[DEBUG] Login attempt for email: ${email}`);
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (!profile) {
      console.log(`[DEBUG] Login failed: User not found for email ${email}`);
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, profile.passwordHash);
    if (!isValid) {
      console.log(`[DEBUG] Login failed: Password mismatch for email ${email}`);
      throw new Error("Invalid credentials");
    }

    console.log(`[DEBUG] Login successful for email ${email}. Generating JWT...`);

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

  async verifyHardware(userId: number, password: any) {
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

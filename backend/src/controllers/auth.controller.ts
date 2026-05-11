import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/error.js";
import { AuthRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const isDev = process.env.NODE_ENV !== "production";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.register(req.body);
  return successResponse(res, profile, "Registration successful");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", data.token, {
    httpOnly: true,
    secure: isProduction,          // HTTPS only in production
    sameSite: isProduction ? "none" : "lax",  // cross-origin in prod, lax in dev
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return successResponse(res, data, "Login successful");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  return successResponse(res, null, "Logout successful");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  return successResponse(res, null, "Password reset link sent to your email");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  return successResponse(res, null, "Password reset successful");
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return errorResponse(res, "Unauthorized", 401);
  }
  const user = await authService.getMe(userId);
  return successResponse(res, user, "User profile retrieved");
});

export const verifyHardware = asyncHandler(async (req: Request, res: Response) => {
  const fingerId = req.body.finger_id || req.body.userId;
  const password = req.body.password;
  const fingerIdNum = Number(fingerId);

  if (isDev) console.log(`[HARDWARE AUTH] Verifying hardware for finger_id=${fingerId}`);

  if (fingerId === undefined) {
    return res.status(400).json({
      success: false,
      message: "finger_id is required"
    });
  }

  if (Number.isNaN(fingerIdNum)) {
    return res.status(400).json({
      success: false,
      message: "Invalid finger_id"
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "password is required"
    });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.fingerId, fingerIdNum),
    with: {
      profile: true
    }
  });

  if (!user || !user.profile) {
    if (isDev) console.warn(`[HARDWARE AUTH] Verification failed for finger_id=${fingerId}`);
    return res.status(401).json({
      success: false,
      message: "Access Denied"
    });
  }

  try {
    await authService.verifyHardware(Number(fingerId), password);
  } catch (error) {
    if (isDev) console.warn(`[HARDWARE AUTH] Password verification failed for finger_id=${fingerId}`);
    return res.status(401).json({
      success: false,
      message: "Access Denied"
    });
  }

  if (isDev) console.log(`[HARDWARE AUTH] Verification successful for finger_id=${fingerId}`);
  return res.status(200).json({
    success: true,
    userId: user.fingerId,
    name: user.profile.name,
    role: user.profile.role,
    message: "Access Granted"
  });
});

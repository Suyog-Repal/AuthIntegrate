import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error";
import { db } from "../config/database";
import { users } from "../shared_schema";
import { eq } from "drizzle-orm";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.register(req.body);
  return successResponse(res, profile, "Registration successful");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  
  res.cookie("token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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

export const me = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.userId;
  const user = await authService.getMe(userId);
  return successResponse(res, user, "User profile retrieved");
});

export const verifyHardware = asyncHandler(async (req: Request, res: Response) => {
  const fingerId = req.body.finger_id || req.body.userId;
  const password = req.body.password;
  const fingerIdNum = Number(fingerId);

  console.log(`[HARDWARE AUTH] Verifying hardware for finger_id=${fingerId}`);

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
    console.warn(`[HARDWARE AUTH] Verification failed for finger_id=${fingerId}`);
    return res.status(401).json({
      success: false,
      message: "Access Denied"
    });
  }

  try {
    await authService.verifyHardware(Number(fingerId), password);
  } catch (error) {
    console.warn(`[HARDWARE AUTH] Password verification failed for finger_id=${fingerId}`);
    return res.status(401).json({
      success: false,
      message: "Access Denied"
    });
  }

  console.log(`[HARDWARE AUTH] Verification successful for finger_id=${fingerId}`);
  return res.status(200).json({
    success: true,
    userId: user.fingerId,
    name: user.profile.name,
    role: user.profile.role,
    message: "Access Granted"
  });
});

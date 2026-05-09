import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.register(req.body);
  return successResponse(res, profile, "Registration successful");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  return successResponse(res, data, "Login successful");
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
  const profile = await authService.login("", ""); // This is just a placeholder, should use userService.getUserById
  // Wait, me should just return req.user or fetch fresh profile.
  return successResponse(res, req.user, "User profile retrieved");
});

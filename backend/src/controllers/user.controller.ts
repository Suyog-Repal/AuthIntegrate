import { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { successResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/error.js";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  return successResponse(res, users);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const profile = await userService.updateProfile(userId, req.body);
  return successResponse(res, profile, "Profile updated successfully");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  await userService.deleteUser(userId);
  return successResponse(res, null, "User deleted successfully");
});

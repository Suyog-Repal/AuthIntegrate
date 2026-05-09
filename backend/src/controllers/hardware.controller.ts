import { Request, Response } from "express";
import { hardwareService } from "../services/hardware.service";
import { successResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error";

export const handleEvent = asyncHandler(async (req: Request, res: Response) => {
  const { userId, result, note, command } = req.body;
  
  if (command === "REG") {
    // Handle registration event
    hardwareService.processAccessEvent(userId, "REGISTERED", note || "New fingerprint registered");
  } else if (command === "LOGIN") {
    hardwareService.processAccessEvent(userId, result || "DENIED", note || "Hardware login attempt");
  }

  return successResponse(res, null, "Event processed");
});

export const simulateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { userId, result, note } = req.body;
  hardwareService.simulateAccessEvent(userId, result, note);
  return successResponse(res, null, "Event simulated");
});

import { Request, Response } from "express";
import { hardwareService } from "../services/hardware.service";
import { successResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error";
import { db } from "../config/database";
import { users } from "../shared_schema";
import { eq } from "drizzle-orm";

export const handleEvent = asyncHandler(async (req: Request, res: Response) => {
  const fingerId = req.body.finger_id || req.body.userId;
  const { result, note, command } = req.body;
  
  console.log(`[HARDWARE] Event received: finger_id=${fingerId}, Command=${command}, Result=${result}`);
  
  if (fingerId === undefined) {
    return res.status(400).json({
      success: false,
      message: "finger_id is required"
    });
  }

  let user = await db.query.users.findFirst({
    where: eq(users.fingerId, Number(fingerId)),
    with: {
      profile: true
    }
  });

  if (!user && command === "REG") {
    console.log(`[HARDWARE] Registering new fingerprint: finger_id=${fingerId}`);
    const [newUser] = await db.insert(users).values({
      fingerId: Number(fingerId),
    }).returning();
    // Default empty profile structure for new users
    user = { ...newUser, profile: null };
  }

  if (!user) {
    console.warn(`[HARDWARE] Unregistered fingerprint attempted: finger_id=${fingerId}`);
    // Log the denied attempt and emit socket event
    console.log(`[HARDWARE] Processing denied event for unregistered fingerprint`);
    hardwareService.processAccessEvent(null, "DENIED", `Unregistered fingerprint: ${fingerId}`);
    // Return success for hardware event, but access denied
    return res.status(200).json({
      success: false,
      message: "Access Denied"
    });
  }

  // Profile data
  const userName = user.profile?.name || "Unknown";
  const userRole = user.profile?.role || "user";

  if (command === "REG") {
    hardwareService.processAccessEvent(user.id, "REGISTERED", note || "New fingerprint registered");
    return res.status(200).json({
      success: true,
      userId: user.fingerId,
      name: userName,
      role: userRole,
      message: "Fingerprint Registered"
    });
  } else if (command === "LOGIN") {
    console.log(`[HARDWARE] Processing login: finger_id=${fingerId}, internal ID=${user.id}, Result=${result}`);
    
    // If the hardware says granted, or if we want to enforce profile completeness
    const finalResult = result || "DENIED";
    console.log(`[HARDWARE] Final result for user ${user.id}: ${finalResult}`);
    hardwareService.processAccessEvent(user.id, finalResult, note || "Hardware login attempt");
    
    if (finalResult === "DENIED") {
        console.log(`[HARDWARE] Returning 200 for denied access`);
        return res.status(200).json({
            success: false,
            message: "Access Denied"
        });
    }

    return res.status(200).json({
      success: true,
      userId: user.fingerId,
      name: userName,
      role: userRole,
      message: "Access Granted"
    });
  }

  // Fallback for unknown commands
  return res.status(400).json({
      success: false,
      message: "Invalid Command"
  });
});

export const simulateEvent = asyncHandler(async (req: Request, res: Response) => {
  const fingerId = req.body.finger_id || req.body.userId;
  const { result, note } = req.body;
  
  if (fingerId === undefined) {
    return res.status(400).json({ success: false, message: "finger_id is required" });
  }

  let user = await db.query.users.findFirst({
    where: eq(users.fingerId, Number(fingerId)),
  });

  if (!user) {
    const [newUser] = await db.insert(users).values({
      fingerId: Number(fingerId),
    }).returning();
    user = newUser;
  }

  hardwareService.simulateAccessEvent(user.id, result, note);
  return successResponse(res, null, "Event simulated");
});

import { Request, Response } from "express";
import { hardwareService } from "../services/hardware.service.js";
import { successResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/error.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const isDev = process.env.NODE_ENV !== "production";

export const handleEvent = asyncHandler(async (req: Request, res: Response) => {
  const fingerId = req.body.finger_id || req.body.userId;
  const { result, note, command } = req.body;

  if (isDev) {
    console.log(`[HARDWARE] Event received: finger_id=${fingerId}, Command=${command}, Result=${result}`);
  }

  if (fingerId === undefined) {
    return res.status(400).json({
      success: false,
      message: "finger_id is required",
    });
  }

  let user = (await db.query.users.findFirst({
    where: eq(users.fingerId, Number(fingerId)),
    with: { profile: true },
  })) as any;

  if (!user && command === "REG") {
    if (isDev) console.log(`[HARDWARE] Registering new fingerprint: finger_id=${fingerId}`);
    const [newUser] = await db.insert(users).values({ fingerId: Number(fingerId) }).returning();
    user = { ...newUser, profile: null } as any;
  }

  if (!user) {
    if (isDev) console.warn(`[HARDWARE] Unregistered fingerprint attempted: finger_id=${fingerId}`);
    hardwareService.processAccessEvent(null, "DENIED", `Unregistered fingerprint: ${fingerId}`);
    return res.status(200).json({ success: false, message: "Access Denied" });
  }

  const userName = user.profile?.name || "Unknown";
  const userRole = user.profile?.role || "user";

  if (command === "REG") {
    hardwareService.processAccessEvent(user.id, "REGISTERED", note || "New fingerprint registered");
    return res.status(200).json({
      success: true,
      userId: user.fingerId,
      name: userName,
      role: userRole,
      message: "Fingerprint Registered",
    });
  } else if (command === "LOGIN") {
    if (isDev) {
      console.log(`[HARDWARE] Processing login: finger_id=${fingerId}, internal ID=${user.id}, Result=${result}`);
    }
    const finalResult = result || "DENIED";
    if (isDev) console.log(`[HARDWARE] Final result for user ${user.id}: ${finalResult}`);
    hardwareService.processAccessEvent(user.id, finalResult, note || "Hardware login attempt");

    if (finalResult === "DENIED") {
      return res.status(200).json({ success: false, message: "Access Denied" });
    }
    return res.status(200).json({
      success: true,
      userId: user.fingerId,
      name: userName,
      role: userRole,
      message: "Access Granted",
    });
  }

  return res.status(400).json({ success: false, message: "Invalid Command" });
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
    const [newUser] = await db.insert(users).values({ fingerId: Number(fingerId) }).returning();
    user = newUser;
  }

  hardwareService.simulateAccessEvent(user.id, result, note);
  return successResponse(res, null, "Event simulated");
});

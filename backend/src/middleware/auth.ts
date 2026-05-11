import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";
import { errorResponse } from "../utils/response.js";
import { UserPayload } from "../types/index.js";

const isDev = process.env.NODE_ENV !== "production";

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;

  if (token) {
    jwt.verify(token, authConfig.jwtSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return errorResponse(res, "Forbidden", 403);
      }
      req.user = decoded as UserPayload;
      next();
    });
  } else {
    return errorResponse(res, "Unauthorized", 401);
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return errorResponse(res, "Admin access required", 403);
  }
  next();
};

export const authenticateHardware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-hardware-api-key"] || req.query.api_key;
  const validKey = process.env.HARDWARE_API_KEY;

  if (isDev) {
    // In development, log the attempt for debugging
    console.log(`[HARDWARE MIDDLEWARE] ${req.method} ${req.originalUrl}`);
  }

  // If a valid key is configured, always enforce it — dev or prod
  if (validKey) {
    if (apiKey !== validKey) {
      if (isDev) {
        console.warn("[HARDWARE MIDDLEWARE] Invalid hardware API key provided.");
      }
      return res.status(401).json({ success: false, message: "Hardware Authentication Failed" });
    }
    // Key is valid — continue
    return next();
  }

  // No key configured at all
  if (!isDev) {
    // In production, HARDWARE_API_KEY is required — refuse
    console.error("[FATAL] HARDWARE_API_KEY is not set in production. Hardware requests are blocked.");
    return res.status(503).json({
      success: false,
      message: "Hardware authentication is not configured on the server.",
    });
  }

  // Development + no key configured: allow through with a one-time log
  if (isDev) {
    console.warn("[HARDWARE MIDDLEWARE] No HARDWARE_API_KEY set — bypassing check (dev only).");
  }
  next();
};

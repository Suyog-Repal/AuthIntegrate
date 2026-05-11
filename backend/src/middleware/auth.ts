import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";
import { errorResponse } from "../utils/response";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;

  if (token) {
    jwt.verify(token, authConfig.jwtSecret, (err: any, user: any) => {
      if (err) {
        return errorResponse(res, "Forbidden", 403);
      }

      req.user = user;
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
  const apiKey = req.headers['x-hardware-api-key'] || req.query.api_key;
  const validKey = process.env.HARDWARE_API_KEY;

  console.log(`[HARDWARE MIDDLEWARE] Hardware request received: ${req.method} ${req.originalUrl}`);

  if (validKey && apiKey !== validKey) {
    console.warn(`[HARDWARE MIDDLEWARE] Invalid hardware API key provided.`);
    return res.status(401).json({ success: false, message: "Hardware Authentication Failed" });
  }

  if (!validKey) {
    console.log(`[HARDWARE MIDDLEWARE] No HARDWARE_API_KEY configured. Bypassing strict check.`);
  }

  // Ensure no browser session cookie is enforcing this route
  next();
};

import type { Request, Response, NextFunction } from "express";

// Extend Express Request type to include session user
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // This will be checked in the route handler after fetching user profile
  next();
}

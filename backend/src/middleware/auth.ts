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

  if (authHeader) {
    const token = authHeader.split(" ")[1];

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

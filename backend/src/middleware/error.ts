import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.js";

const isDev = process.env.NODE_ENV !== "production";

interface HttpError extends Error {
  status?: number;
}

export const errorHandler = (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  // Always log server errors internally
  console.error(isDev ? err.stack : `[ERROR] ${err.message}`);

  const status = err.status || 500;
  // Never expose raw error objects or stack traces to the client in production
  const message = err.message || "Internal Server Error";

  return errorResponse(res, message, status, isDev ? err : undefined);
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

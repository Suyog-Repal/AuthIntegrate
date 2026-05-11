import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

const isDev = process.env.NODE_ENV !== "production";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Always log server errors internally
  console.error(isDev ? err.stack : `[ERROR] ${err.message}`);

  const status = err.status || 500;
  // Never expose raw error objects or stack traces to the client in production
  const message = err.message || "Internal Server Error";

  return errorResponse(res, message, status, isDev ? err : undefined);
};

export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

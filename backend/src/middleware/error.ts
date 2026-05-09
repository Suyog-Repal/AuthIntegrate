import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  return errorResponse(res, message, status, err);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

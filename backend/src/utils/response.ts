import { Response } from "express";

export const successResponse = (res: Response, data: unknown, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res: Response, message = "Error", status = 500, error: unknown = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error : undefined,
  });
};

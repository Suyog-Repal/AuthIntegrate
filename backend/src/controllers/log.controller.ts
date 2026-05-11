import { Request, Response } from "express";
import { logService } from "../services/log.service.js";
import { exportService } from "../services/export.service.js";
import { successResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/error.js";
import { hardwareService } from "../services/hardware.service.js";

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    date: req.query.date,
    month: req.query.month ? parseInt(req.query.month as string) : undefined,
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    status: req.query.status,
    userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
  };
  const logs = await logService.getLogsWithFilters(filters);
  return successResponse(res, logs);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await logService.getSystemStats();
  return successResponse(res, {
    ...stats,
    hardwareConnected: hardwareService.isConnected(),
  });
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    date: req.query.date,
    month: req.query.month ? parseInt(req.query.month as string) : undefined,
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    status: req.query.status,
    userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    limit: 10000,
  };
  const logs = await logService.getLogsWithFilters(filters);
  const buffer = await exportService.exportToExcel(logs);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.xlsx"');
  return res.send(buffer);
});

export const exportPDF = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    date: req.query.date,
    month: req.query.month ? parseInt(req.query.month as string) : undefined,
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    status: req.query.status,
    userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    limit: 10000,
  };
  const logs = await logService.getLogsWithFilters(filters);
  const buffer = await exportService.exportToPDF(logs);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.pdf"');
  return res.send(buffer);
});

import { Request, Response } from "express";
import { logService } from "../services/log.service";
import { exportService } from "../services/export.service";
import { successResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error";
import { hardwareService } from "../services/hardware.service";

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    date: req.query.date,
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
  const logs = await logService.getLogsWithFilters({ limit: 10000 });
  const buffer = await exportService.exportToExcel(logs);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.xlsx"');
  return res.send(buffer);
});

export const exportPDF = asyncHandler(async (req: Request, res: Response) => {
  const logs = await logService.getLogsWithFilters({ limit: 10000 });
  const buffer = await exportService.exportToPDF(logs);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.pdf"');
  return res.send(buffer);
});

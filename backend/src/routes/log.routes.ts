import { Router } from "express";
import * as logController from "../controllers/log.controller";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

router.get("/", authenticateJWT, logController.getLogs);
router.get("/stats", logController.getStats);
router.get("/export/excel", authenticateJWT, logController.exportExcel);
router.get("/export/pdf", authenticateJWT, logController.exportPDF);

export default router;

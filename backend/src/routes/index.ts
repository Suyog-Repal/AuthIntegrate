import { Router } from "express";
import authRoutes from "./auth.routes";
import logRoutes from "./log.routes";
import userRoutes from "./user.routes";
import hardwareRoutes from "./hardware.routes";

import * as logController from "../controllers/log.controller";

const router = Router();

router.use("/auth", authRoutes);
router.use("/logs", logRoutes);
router.use("/users", userRoutes);
router.use("/hardware", hardwareRoutes);
router.get("/stats", logController.getStats);

export default router;

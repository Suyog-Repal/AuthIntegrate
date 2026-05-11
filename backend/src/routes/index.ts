import { Router } from "express";
import authRoutes from "./auth.routes.js";
import logRoutes from "./log.routes.js";
import userRoutes from "./user.routes.js";
import hardwareRoutes from "./hardware.routes.js";

import * as logController from "../controllers/log.controller.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/logs", logRoutes);
router.use("/users", userRoutes);
router.use("/hardware", hardwareRoutes);
router.get("/stats", logController.getStats);

export default router;

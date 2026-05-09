import { Router } from "express";
import authRoutes from "./auth.routes";
import logRoutes from "./log.routes";
import userRoutes from "./user.routes";
import hardwareRoutes from "./hardware.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/logs", logRoutes);
router.use("/users", userRoutes);
router.use("/hardware", hardwareRoutes);

export default router;

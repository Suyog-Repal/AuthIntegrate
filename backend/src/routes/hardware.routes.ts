import { Router } from "express";
import * as hardwareController from "../controllers/hardware.controller";

const router = Router();

router.post("/event", hardwareController.handleEvent);
router.post("/simulate", hardwareController.simulateEvent);

export default router;

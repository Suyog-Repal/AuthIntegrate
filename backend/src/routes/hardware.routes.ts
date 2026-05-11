import { Router } from "express";
import * as hardwareController from "../controllers/hardware.controller.js";
import { authenticateHardware } from "../middleware/auth.js";

const router = Router();

router.use(authenticateHardware);

router.post("/event", hardwareController.handleEvent);
router.post("/simulate", hardwareController.simulateEvent);

export default router;

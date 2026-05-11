import { Router } from "express";
import * as hardwareController from "../controllers/hardware.controller";
import { authenticateHardware } from "../middleware/auth";

const router = Router();

router.use(authenticateHardware);

router.post("/event", hardwareController.handleEvent);
router.post("/simulate", hardwareController.simulateEvent);

export default router;

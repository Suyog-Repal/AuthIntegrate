import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticateJWT, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticateJWT, requireAdmin, userController.getAllUsers);
router.put("/:id", authenticateJWT, requireAdmin, userController.updateProfile);
router.delete("/:id", authenticateJWT, requireAdmin, userController.deleteUser);

export default router;

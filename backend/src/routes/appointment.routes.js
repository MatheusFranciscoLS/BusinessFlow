import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import * as controller from "../controllers/appointment.controller.js";

const router = Router();

router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.remove);

export default router;

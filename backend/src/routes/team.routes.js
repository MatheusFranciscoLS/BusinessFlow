import { Router } from "express";
import * as teamController from "../controllers/team.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { requireManager, requireSocio } from "../middlewares/roles.js";

const router = Router();

router.use(authMiddleware, requireManager, companyMiddleware);

// Todos da equipe veem quem está nela; só dono e sócios mexem.
router.get("/", teamController.list);
router.post("/", requireSocio, teamController.add);
router.put("/:userId", requireSocio, teamController.changeRole);
router.delete("/:userId", requireSocio, teamController.remove);

export default router;

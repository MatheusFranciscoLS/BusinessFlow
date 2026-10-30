import { Router } from "express";
import { getLogs } from "../controllers/audit.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { requireManager } from "../middlewares/roles.js";

const routes = Router();

// Só o gestor vê o log, e só da empresa que ele escolheu (e que é dele).
routes.get("/", authMiddleware, requireManager, companyMiddleware, getLogs);

export default routes;

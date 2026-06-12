import { Router } from "express";
import { getLogs } from "../controllers/audit.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const routes = Router();

// Rota blindada pelo middleware
routes.get("/", authMiddleware, getLogs);

export default routes;

import { Router } from "express";
import * as portalController from "../controllers/portal.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { portalScope } from "../middlewares/portal.js";
import upload from "../config/multer.js";

const router = Router();

// Rotas do portal: só o perfil CLIENT (o gestor não tem cliente próprio aqui).
const onlyPortalClient = (req, res, next) => {
  if (!req.portal) {
    return res.status(403).json({ error: "Rota exclusiva do portal do cliente." });
  }
  next();
};

router.use(authMiddleware, companyMiddleware, portalScope, onlyPortalClient);

router.get("/pending", portalController.pending);
router.post("/documents", upload.single("file"), portalController.uploadDocument);

export default router;

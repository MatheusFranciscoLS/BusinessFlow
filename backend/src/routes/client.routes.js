import { Router } from "express";
import * as clientController from "../controllers/client.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

// 🔥 INTERCEPTOR ZERO TRUST: Bloqueia utilizadores com o cargo "CLIENT"
const requireAdmin = (req, res, next) => {
  const role = req.user?.role || req.query.role;
  if (role === "CLIENT") {
    return res
      .status(403)
      .json({ error: "Acesso restrito à gestão do escritório." });
  }
  next();
};

// Todas as rotas de CRM passam pela tranca do Escritório (Admin)
router.use(authMiddleware, companyMiddleware, requireAdmin);

router.post("/", clientController.create);
router.get("/", clientController.getAll);
router.get("/:id", clientController.getById);
router.put("/:id", clientController.update);
router.delete("/:id", clientController.remove);

export default router;

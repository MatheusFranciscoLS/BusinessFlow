import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { requireManager } from "../middlewares/roles.js";
import { companyMiddleware } from "../middlewares/company.js";
import * as home from "../services/home.service.js";

const router = Router();

// Início e mapa da competência são telas do escritório.
router.use(authMiddleware, requireManager, companyMiddleware);

router.get("/overview", async (req, res) => {
  try {
    return res.json(await home.overview(req.companyId));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao montar o início." });
  }
});

router.get("/competence", async (req, res) => {
  try {
    // Sem mês na URL: a competência anterior, que é a que o escritório entrega neste mês.
    const now = new Date();
    const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const month = req.query.month ?? previous.getUTCMonth() + 1;
    const year = req.query.year ?? previous.getUTCFullYear();
    return res.json(await home.competence(req.companyId, month, year));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;

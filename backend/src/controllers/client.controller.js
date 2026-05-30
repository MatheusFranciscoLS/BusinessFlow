import * as clientService from "../services/client.service.js";
import { Router } from "express";
import * as clientController from "../controllers/client.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

export async function create(req, res) {
  try {
    // 🔥 Agora usamos req.companyId em vez de req.user.id
    const data = await clientService.createClient(req.companyId, req.body);
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const data = await clientService.getAllClients(req.companyId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const data = await clientService.getClientById(
      req.companyId,
      req.params.id,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const data = await clientService.updateClient(
      req.companyId,
      req.params.id,
      req.body,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await clientService.deleteClient(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// 🔥 INTERCEPTOR ZERO TRUST: Bloqueia utilizadores com o cargo "CLIENT"
const requireAdmin = (req, res, next) => {
  const role = req.user?.role || req.query.role;
  if (role === "CLIENT") {
    return res.status(403).json({ error: "Acesso restrito à gestão do escritório." });
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
import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { portalScope } from "../middlewares/portal.js";
import { requireManager, requireSocio } from "../middlewares/roles.js";
import upload from "../config/multer.js";
import prisma from "../config/prisma.js";

const router = Router();

router.use(authMiddleware);
router.use(companyMiddleware);
router.use(portalScope);

// Perfil e e-mail vêm do banco (nunca da URL) e seguem para os controllers.
router.use(async (req, res, next) => {
  try {
    const loggedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, email: true },
    });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador não encontrado." });

    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

router.put("/:id/read", documentController.markAsRead);
router.get("/:id/file", documentController.downloadFile);
router.put("/:id/sign", documentController.sign);
router.get("/", documentController.getAll);

router.post("/", requireManager, upload.single("file"), documentController.create);
router.delete("/:id", requireManager, requireSocio, documentController.remove);

export default router;

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 🔥 ROTA PARA O CONTADOR GERAR UM LOGIN PARA O SEU CLIENTE
router.post("/client-account", authMiddleware, async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    // 1. Verifica se o e-mail já está a ser usado por outra pessoa
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({ error: "Este e-mail já está cadastrado no sistema." });
    }

    // 2. Criptografa a senha do cliente
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Cria o utilizador com a flag CLIENT vinculada à empresa dele
    const clientUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
        companyAccessId: companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyAccessId: true,
      },
    });

    return res.status(201).json(clientUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

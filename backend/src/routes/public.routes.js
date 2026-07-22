import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { apiKeyMiddleware } from "../middlewares/apiKey.js";

const router = Router();
const prisma = new PrismaClient();

router.use(apiKeyMiddleware);

// Exemplo de Rota Pública: Listar todos os clientes ativos da empresa
router.get("/clients", async (req, res) => {
    try {
        // req.companyId foi injetado pelo nosso Porteiro (apiKeyMiddleware)
        const clients = await prisma.client.findMany({
            where: { companyId: req.companyId, status: "ATIVO" },
            select: {
                id: true,
                fullName: true,
                document: true,
                email: true
                // Não devolvemos dados sensíveis, apenas o necessário para integrações
            }
        });

        return res.json(clients);
    } catch (error) {
        return res.status(500).json({ error: "Erro interno na API." });
    }
});

export default router;
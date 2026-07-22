import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function apiKeyMiddleware(req, res, next) {
    try {
        // Padrão de mercado: buscar a chave no header "x-api-key"
        const apiKey = req.headers["x-api-key"];

        if (!apiKey) {
            return res.status(401).json({ error: "Acesso negado. API Key não fornecida." });
        }

        // Procura a chave no banco de dados
        const validKey = await prisma.apiKey.findUnique({
            where: { key: apiKey },
        });

        if (!validKey || !validKey.isActive) {
            return res.status(401).json({ error: "API Key inválida ou revogada." });
        }

        // 🔥 AUDITORIA: Atualiza a data de "último uso" para o Gestor saber que a chave está ativa
        await prisma.apiKey.update({
            where: { id: validKey.id },
            data: { lastUsed: new Date() }
        });

        // Injeta o ID da empresa dona desta chave na requisição
        // Assim, o sistema externo só consegue ver os dados desta empresa específica (Zero Trust!)
        req.companyId = validKey.companyId;

        next();
    } catch (error) {
        return res.status(500).json({ error: "Falha na validação da API Key." });
    }
}
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function createKey(req, res) {
    try {
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: "O nome da integração é obrigatório." });

        // Gera uma chave única e segura com 48 caracteres hexadecimais
        const rawKey = crypto.randomBytes(24).toString("hex");
        const apiKeyString = `bf_live_${rawKey}`; // 'bf' de BusinessFlow

        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key: apiKeyString,
                companyId: req.companyId, // Atrela a chave à empresa logada
            },
        });

        return res.status(201).json(apiKey);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao gerar chave de API." });
    }
}

export async function listKeys(req, res) {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { companyId: req.companyId },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(keys);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar chaves." });
    }
}

export async function revokeKey(req, res) {
    try {
        const { id } = req.params;
        await prisma.apiKey.delete({
            where: { id, companyId: req.companyId },
        });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "Erro ao revogar chave." });
    }
}
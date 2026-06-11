import * as clientService from "../services/client.service.js";
import { registerLog } from "../services/audit.service.js"; // 🔥 1. Importamos a Caixa Preta
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create(req, res) {
  try {
    const data = await clientService.createClient(req.companyId, req.body);

    // 🔥 2. ESPIÃO: Regista a criação de um novo cliente
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "CREATE",
      "CLIENTES",
      `Cadastrou o novo cliente: ${data.fullName}`,
    );

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

    // 🔥 3. ESPIÃO: Regista a alteração de dados (ex: alteração de honorários)
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "UPDATE",
      "CLIENTES",
      `Atualizou os dados cadastrais do cliente: ${data.fullName}`,
    );

    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    // Descobrimos quem era o cliente antes de o apagar para o log ficar perfeito
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    });
    if (!client)
      return res.status(404).json({ error: "Cliente não encontrado." });

    await clientService.deleteClient(req.companyId, req.params.id);

    // 🔥 4. ESPIÃO: Alarme máximo! Um cliente e todo o seu histórico foram apagados.
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "DELETE",
      "CLIENTES",
      `Apagou o cliente e todo o seu histórico (Dossiê, Faturas, Documentos): ${client.fullName}`,
    );

    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

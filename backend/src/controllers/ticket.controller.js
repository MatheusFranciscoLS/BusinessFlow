import * as ticketService from "../services/ticket.service.js";
import { registerLog } from "../services/audit.service.js"; // 🔥 1. A Caixa Preta
import prisma from "../config/prisma.js";

const senderRole = (req) => (req.portal ? "CLIENT" : "ADMIN");

// Chamado da empresa logada e, no portal, só os do próprio cliente.
async function findVisibleTicket(req) {
  const where = { id: req.params.id, companyId: req.companyId };
  if (req.portal) where.clientId = req.portal.clientId ?? "sem-cadastro";
  return prisma.ticket.findFirst({ where, select: { id: true } });
}

export async function getUnreadCount(req, res) {
  try {
    const { role, userEmail } = req.query;
    const count = await ticketService.getUnreadCount(
      req.companyId,
      role,
      userEmail,
    );
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar notificações." });
  }
}

export async function create(req, res) {
  try {
    // O perfil e, no portal, o cliente vêm do servidor, não do corpo da requisição.
    const clientId = req.portal ? req.portal.clientId : req.body.clientId;
    if (!clientId)
      return res.status(403).json({ error: "Cliente não vinculado a esta empresa." });

    const owner = await prisma.client.findFirst({
      where: { id: clientId, companyId: req.companyId },
      select: { id: true },
    });
    if (!owner)
      return res.status(400).json({ error: "Cliente não encontrado nesta empresa." });

    const ticket = await ticketService.createTicket({
      ...req.body,
      clientId,
      role: senderRole(req),
      companyId: req.companyId,
    });

    // 🔥 2. ESPIÃO: Abertura de chamado
    registerLog(
      req.companyId,
      req.actor,
      "CREATE",
      "CHAMADOS",
      `Abriu um novo chamado de Suporte: "${ticket.subject}"`,
    );

    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao abrir chamado." });
  }
}

export async function getAll(req, res) {
  try {
    // 1. Pegamos a página e o limite da URL
    const { role, userEmail, page = 1, limit = 50 } = req.query;

    // 2. Passamos tudo para o Service (que vai fazer o trabalho sujo)
    const { tickets, total } = await ticketService.getTickets(
      req.companyId,
      role,
      userEmail,
      Number(page),
      Number(limit),
    );

    // 3. Colocamos o total de itens escondido no Cabeçalho (Headers)
    res.set("X-Total-Count", total);
    res.set("X-Total-Pages", Math.ceil(total / limit));
    res.set("X-Current-Page", page);
    res.set(
      "Access-Control-Expose-Headers",
      "X-Total-Count, X-Total-Pages, X-Current-Page",
    );

    // 4. Devolvemos a array limpa para o Front-end não quebrar
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar chamados." });
  }
}

export async function addMessage(req, res) {
  try {
    if (!(await findVisibleTicket(req)))
      return res.status(404).json({ error: "Chamado não encontrado." });

    const newMessage = await ticketService.addMessage(req.params.id, {
      message: req.body.message,
      senderRole: senderRole(req),
      senderName: req.actor.name,
    });

    // 🔥 3. ESPIÃO: Resposta no chamado
    registerLog(
      req.companyId,
      req.actor,
      "UPDATE",
      "CHAMADOS",
      `Enviou uma resposta no chamado de suporte.`,
    );

    return res.status(201).json(newMessage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
}

export async function markAsRead(req, res) {
  try {
    if (!(await findVisibleTicket(req)))
      return res.status(404).json({ error: "Chamado não encontrado." });

    await ticketService.markAsRead(req.params.id, senderRole(req));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao marcar como lido." });
  }
}

export async function updateStatus(req, res) {
  try {
    if (!(await findVisibleTicket(req)))
      return res.status(404).json({ error: "Chamado não encontrado." });

    const updatedTicket = await ticketService.updateStatus(
      req.params.id,
      req.body,
    );

    // 🔥 4. ESPIÃO: Mudança de Status (Ex: Fechou o chamado)
    registerLog(
      req.companyId,
      req.actor,
      "UPDATE",
      "CHAMADOS",
      `Alterou o status do chamado "${updatedTicket.subject}" para: ${updatedTicket.status}`,
    );

    return res.json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status." });
  }
}

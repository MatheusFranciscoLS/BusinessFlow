import * as ticketService from "../services/ticket.service.js";
import { registerLog } from "../services/audit.service.js"; // 🔥 1. A Caixa Preta

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
    const ticket = await ticketService.createTicket({
      ...req.body,
      companyId: req.companyId,
    });

    // 🔥 2. ESPIÃO: Abertura de chamado
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
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
    const { role, userEmail } = req.query;
    const tickets = await ticketService.getTickets(
      req.companyId,
      role,
      userEmail,
    );
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar chamados." });
  }
}

export async function addMessage(req, res) {
  try {
    const newMessage = await ticketService.addMessage(req.params.id, req.body);

    // 🔥 3. ESPIÃO: Resposta no chamado
    registerLog(
      req.companyId,
      { name: newMessage.senderName, role: newMessage.senderRole },
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
    await ticketService.markAsRead(req.params.id, req.body.role);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao marcar como lido." });
  }
}

export async function updateStatus(req, res) {
  try {
    const updatedTicket = await ticketService.updateStatus(
      req.params.id,
      req.body,
    );

    // 🔥 4. ESPIÃO: Mudança de Status (Ex: Fechou o chamado)
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "UPDATE",
      "CHAMADOS",
      `Alterou o status do chamado "${updatedTicket.subject}" para: ${updatedTicket.status}`,
    );

    return res.json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status." });
  }
}

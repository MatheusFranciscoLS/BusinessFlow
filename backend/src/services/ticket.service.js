import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getUnreadCount(companyId, role, userEmail) {
  let where = { companyId };

  if (role === "CLIENT") {
    const clientRecord = await prisma.client.findFirst({
      where: { companyId, email: userEmail },
    });
    if (!clientRecord) return 0;
    where = { companyId, clientId: clientRecord.id, hasUnreadClient: true };
  } else {
    where = { companyId, hasUnreadAdmin: true };
  }
  return prisma.ticket.count({ where });
}

export async function createTicket(data) {
  return prisma.ticket.create({
    data: {
      subject: data.subject,
      department: data.department,
      description: data.description,
      priority: data.priority,
      clientId: data.clientId,
      companyId: data.companyId,
      hasUnreadAdmin: data.role === "CLIENT",
      hasUnreadClient: data.role === "ADMIN",
    },
  });
}

// 🔥 Fechadura Zero Trust
export async function getTickets(companyId, role, userEmail) {
  let where = { companyId };

  if (role === "CLIENT") {
    const clientRecord = await prisma.client.findFirst({
      where: { companyId, email: userEmail },
    });
    if (!clientRecord) return []; // Bloqueio total
    where.clientId = clientRecord.id;
  }

  return prisma.ticket.findMany({
    where,
    include: { client: true, messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function addMessage(ticketId, data) {
  const newMessage = await prisma.ticketMessage.create({
    data: {
      message: data.message,
      senderRole: data.senderRole,
      senderName: data.senderName,
      ticketId,
    },
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      hasUnreadAdmin: data.senderRole === "CLIENT",
      hasUnreadClient: data.senderRole === "ADMIN",
      status: data.senderRole === "CLIENT" ? "ABERTO" : "EM_ANDAMENTO",
    },
  });

  return newMessage;
}

export async function markAsRead(ticketId, role) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data:
      role === "CLIENT"
        ? { hasUnreadClient: false }
        : { hasUnreadAdmin: false },
  });
}

export async function updateStatus(ticketId, data) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
    },
  });
}

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createAppointment(companyId, data) {
  return prisma.appointment.create({
    data: {
      title: data.title || "Sem Título",
      type: data.type || "TAREFA",
      date: new Date(data.date),
      notes: data.notes,
      status: data.status || "pendente",
      clientId: data.clientId || null, // Se não vier cliente, fica null sem dar erro
      companyId,
    },
  });
}

export async function getAllAppointments(companyId) {
  return prisma.appointment.findMany({
    where: { companyId },
    include: { client: true },
    orderBy: { date: "asc" },
  });
}

export async function updateAppointment(companyId, id, data) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, companyId },
  });
  if (!appointment) throw new Error("Agendamento não encontrado.");

  const updateData = {};
  if (data.title) updateData.title = data.title;
  if (data.type) updateData.type = data.type;
  if (data.date) updateData.date = new Date(data.date);
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status) updateData.status = data.status;
  if (data.clientId !== undefined) updateData.clientId = data.clientId || null;

  return prisma.appointment.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteAppointment(companyId, id) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, companyId },
  });
  if (!appointment) throw new Error("Agendamento não encontrado.");
  return prisma.appointment.delete({ where: { id } });
}

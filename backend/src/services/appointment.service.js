import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createAppointment(companyId, data) {
  return prisma.appointment.create({
    data: {
      date: new Date(data.date),
      notes: data.notes,
      status: data.status || "pendente",
      clientId: data.clientId,
      companyId, // 🔥 Vinculado à empresa atual!
    },
  });
}
export async function getAllAppointments(companyId) {
  return prisma.appointment.findMany({
    where: { companyId },
    include: { client: { select: { fullName: true, phone: true } } },
    orderBy: { date: "asc" },
  });
}
export async function getAppointmentById(companyId, id) {
  const appt = await prisma.appointment.findFirst({
    where: { id, companyId },
    include: { client: true },
  });
  if (!appt) throw new Error("Agendamento não encontrado.");
  return appt;
}
export async function updateAppointment(companyId, id, data) {
  const appt = await prisma.appointment.findFirst({ where: { id, companyId } });
  if (!appt) throw new Error("Agendamento não encontrado.");
  return prisma.appointment.update({
    where: { id },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      notes: data.notes,
      status: data.status,
      clientId: data.clientId,
    },
  });
}
export async function deleteAppointment(companyId, id) {
  const appt = await prisma.appointment.findFirst({ where: { id, companyId } });
  if (!appt) throw new Error("Agendamento não encontrado.");
  return prisma.appointment.delete({ where: { id } });
}

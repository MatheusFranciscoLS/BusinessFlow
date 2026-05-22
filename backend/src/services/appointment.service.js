import prisma from "../config/prisma.js";
import { z } from "zod";

const appointmentSchema = z.object({
  clientId: z.string(),
  date: z.string().datetime(),
  status: z.enum(["pendente", "concluido", "cancelado"]).default("pendente"),
  notes: z.string().optional(),
});

export async function create(data, userId) {
  const validated = appointmentSchema.parse(data);

  // Verifica se o cliente escolhido realmente pertence a essa empresa
  const client = await prisma.client.findFirst({ where: { id: validated.clientId, userId }});
  if (!client) throw new Error("Cliente inválido ou não pertence a você.");

  return prisma.appointment.create({
    data: { ...validated, userId }, // Salva com o ID do dono
    include: { client: true },
  });
}

export async function getAll(userId) {
  return prisma.appointment.findMany({
    where: { userId }, // Filtra
    include: { client: true },
    orderBy: { date: "asc" },
  });
}

export async function getById(id, userId) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, userId },
    include: { client: true },
  });
  if (!appointment) throw new Error("Agendamento não encontrado.");
  return appointment;
}

export async function update(id, data, userId) {
  await getById(id, userId); // Trava de segurança
  const validated = appointmentSchema.partial().parse(data);

  return prisma.appointment.update({
    where: { id },
    data: validated,
    include: { client: true },
  });
}

export async function remove(id, userId) {
  await getById(id, userId); // Trava de segurança
  await prisma.appointment.delete({ where: { id } });
  return { message: "Agendamento removido com sucesso." };
}
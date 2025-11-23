import prisma from "../config/prisma.js";
import { z } from "zod";

const appointmentSchema = z.object({
  clientId: z.string(),
  date: z.string().datetime(),
  status: z.enum(["pendente", "concluido", "cancelado"]).default("pendente"),
  notes: z.string().optional(),
});

export async function create(data) {
  const validated = appointmentSchema.parse(data);

  return prisma.appointment.create({
    data: validated,
    include: {
      client: true,
    },
  });
}

export async function getAll() {
  return prisma.appointment.findMany({
    include: { client: true },
    orderBy: { date: "asc" },
  });
}

export async function getById(id) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!appointment) throw new Error("Agendamento não encontrado.");

  return appointment;
}

export async function update(id, data) {
  const validated = appointmentSchema.partial().parse(data);

  return prisma.appointment.update({
    where: { id },
    data: validated,
    include: { client: true },
  });
}

export async function remove(id) {
  await prisma.appointment.delete({
    where: { id },
  });

  return { message: "Agendamento removido com sucesso." };
}

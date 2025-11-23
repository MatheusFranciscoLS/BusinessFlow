import prisma from "../config/prisma.js";
import { z } from "zod";
import axios from "axios";

const createSchema = z.object({
  fullName: z.string().min(3),
  cpf: z.string().min(11),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cep: z.string().optional(),
  tag: z.enum(["NOVO", "VIP", "RECORRENTE", "INADIMPLENTE"]).optional(),
  notes: z.string().optional(),
});

async function fetchAddressFromCep(cep) {
  if (!cep) return null;

  try {
    const response = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);
    const data = response.data;

    return `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}`;
  } catch (e) {
    return null; // não quebra o cadastro
  }
}

export async function create(data) {
  const validated = createSchema.parse(data);

  const existingCpf = await prisma.client.findUnique({
    where: { cpf: validated.cpf },
  });

  if (existingCpf) throw new Error("CPF já cadastrado.");

  const address = await fetchAddressFromCep(validated.cep);

  return prisma.client.create({
    data: {
      ...validated,
      address,
    },
  });
}

export async function getAll() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Cliente não encontrado.");
  return client;
}

export async function update(id, data) {
  const validated = createSchema.partial().parse(data);

  let address = undefined;

  if (validated.cep) {
    address = await fetchAddressFromCep(validated.cep);
  }

  return prisma.client.update({
    where: { id },
    data: {
      ...validated,
      ...(address && { address }),
    },
  });
}

export async function remove(id) {
  return prisma.client.delete({ where: { id } });
}

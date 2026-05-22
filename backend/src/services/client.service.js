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
    return null; 
  }
}

export async function create(data, userId) {
  const validated = createSchema.parse(data);

  const existingCpf = await prisma.client.findUnique({
    where: { cpf: validated.cpf },
  });

  if (existingCpf) throw new Error("CPF já cadastrado.");

  const address = await fetchAddressFromCep(validated.cep);

  return prisma.client.create({
    data: { ...validated, address, userId }, // Salva com o ID do dono
  });
}

export async function getAll(userId) {
  return prisma.client.findMany({
    where: { userId }, // Filtra só os clientes dessa empresa
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id, userId) {
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) throw new Error("Cliente não encontrado ou acesso negado.");
  return client;
}

export async function update(id, data, userId) {
  await getById(id, userId); // Trava de segurança
  const validated = createSchema.partial().parse(data);
  let address = undefined;
  if (validated.cep) address = await fetchAddressFromCep(validated.cep);

  return prisma.client.update({
    where: { id },
    data: { ...validated, ...(address && { address }) },
  });
}

export async function remove(id, userId) {
  await getById(id, userId); // Trava de segurança
  return prisma.client.delete({ where: { id } });
}
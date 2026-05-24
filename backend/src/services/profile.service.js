import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!user) throw new Error("Utilizador não encontrado.");
  return user;
}

export async function updateProfile(userId, data, avatarPath) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilizador não encontrado.");

  const updateData = {
    name: data.name || user.name,
    email: data.email || user.email,
  };

  if (avatarPath) {
    updateData.avatarUrl = avatarPath;
  }

  // Se o utilizador quiser alterar a palavra-passe
  if (data.oldPassword && data.newPassword) {
    const passwordMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!passwordMatch) {
      throw new Error("A senha atual digitada está incorreta.");
    }
    updateData.password = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
}

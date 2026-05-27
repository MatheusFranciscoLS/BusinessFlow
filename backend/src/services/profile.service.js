import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // 🔥 CORREÇÃO: Agora o sistema lembra-se do cargo (role) e da agência após o F5!
    select: { 
      id: true, 
      name: true, 
      email: true, 
      avatarUrl: true, 
      agencyName: true, 
      role: true, 
      companyAccessId: true 
    },
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
    // Garante que o nome da agência também pode ser atualizado aqui
    agencyName: data.agencyName !== undefined ? data.agencyName : user.agencyName,
  };

  if (avatarPath) {
    updateData.avatarUrl = avatarPath;
  } else if (data.removeAvatar === "true") {
    updateData.avatarUrl = null;
  }

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
    // 🔥 CORREÇÃO: Devolvemos sempre a role para nunca quebrar o sistema
    select: { 
      id: true, 
      name: true, 
      email: true, 
      avatarUrl: true, 
      agencyName: true, 
      role: true, 
      companyAccessId: true 
    },
  });
}
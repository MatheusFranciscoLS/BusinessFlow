import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // 🔥 Agora devolvemos também o agencyName
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      agencyName: true,
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
    // 🔥 Se o Front-end enviar o nome da agência, gravamos!
    agencyName:
      data.agencyName !== undefined ? data.agencyName : user.agencyName,
  };

  // Se veio um arquivo novo, salva. Se veio a ordem de apagar, anula a foto!
  if (avatarPath) {
    updateData.avatarUrl = avatarPath;
  } else if (data.removeAvatar === "true") {
    updateData.avatarUrl = null;
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
    // 🔥 Devolvemos a agência atualizada para o Front-end atualizar o PDF na hora
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      agencyName: true,
    },
  });
}

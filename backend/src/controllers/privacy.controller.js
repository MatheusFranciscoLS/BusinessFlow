import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { registerLog } from "../services/audit.service.js";

// Versão dos termos e da política de privacidade em vigor. Mude quando o texto mudar,
// para pedir o aceite de novo.
export const TERMS_VERSION = "2026-10-rascunho";

// Direito de acesso (LGPD): a pessoa baixa os dados que o sistema guarda sobre ela.
export async function exportData(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, agencyName: true, createdAt: true, termsAcceptedAt: true, termsVersion: true },
    });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado." });

    const data = { generatedAt: new Date().toISOString(), user };

    if (user.role === "CLIENT") {
      const client = await prisma.client.findFirst({
        where: { email: user.email, companyId: req.user.companyAccessId ?? undefined },
        select: { id: true, fullName: true, document: true, taxRegime: true, monthlyFee: true, status: true, email: true, phone: true, createdAt: true },
      });
      data.client = client;
      if (client) {
        const where = { clientId: client.id };
        [data.transactions, data.documents, data.tickets, data.tasks] = await Promise.all([
          prisma.transaction.findMany({ where, select: { title: true, amount: true, type: true, category: true, date: true, status: true } }),
          prisma.document.findMany({ where, select: { name: true, category: true, createdAt: true, readAt: true, isSigned: true, signedAt: true } }),
          prisma.ticket.findMany({
            where,
            select: { subject: true, department: true, description: true, status: true, messages: { select: { message: true, senderName: true, createdAt: true } } },
          }),
          prisma.task.findMany({ where, select: { title: true, description: true, status: true, dueDate: true } }),
        ]);
      }
    } else {
      data.companies = await prisma.company.findMany({
        where: { userId: user.id },
        select: { name: true, document: true, createdAt: true },
      });
    }

    res.set("Content-Disposition", 'attachment; filename="meus-dados-businessflow.json"');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao reunir os seus dados." });
  }
}

export async function termsStatus(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { termsAcceptedAt: true, termsVersion: true },
  });
  if (!user) return res.status(401).json({ error: "Usuário não encontrado." });

  return res.json({
    currentVersion: TERMS_VERSION,
    acceptedAt: user.termsAcceptedAt,
    acceptedVersion: user.termsVersion,
    upToDate: user.termsVersion === TERMS_VERSION,
  });
}

export async function acceptTerms(req, res) {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
      select: { termsAcceptedAt: true, termsVersion: true },
    });
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: "Não foi possível registrar o aceite." });
  }
}

// Direito de eliminação (LGPD) para o cliente do portal: apaga o acesso dele, com
// confirmação da senha. O cadastro e os registros contábeis ficam com o escritório,
// que precisa guardá-los por obrigação legal.
export async function revokeOwnAccess(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado." });

    if (user.role !== "CLIENT") {
      return res.status(403).json({
        error: "A conta do escritório não é apagada por aqui. Fale com o suporte para encerrar a conta.",
      });
    }

    const password = req.body?.password;
    if (typeof password !== "string" || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Senha incorreta." });
    }

    await prisma.user.delete({ where: { id: user.id } });

    if (user.companyAccessId) {
      registerLog(user.companyAccessId, { name: user.name, role: "CLIENT" }, "DELETE", "PRIVACIDADE", "Revogou o próprio acesso ao portal (LGPD)");
    }
    return res.json({ message: "Seu acesso ao portal foi apagado." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao apagar o acesso." });
  }
}

import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { registerLog } from "../services/audit.service.js";

const ROLES = ["SOCIO", "ANALISTA"];

const memberSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(ROLES, { message: "Perfil deve ser SOCIO ou ANALISTA" }),
});

const isOwner = (req) => req.teamRole === "OWNER";

// Quem está na equipe desta empresa: o dono e os membros, com o perfil de cada um.
export async function list(req, res) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        user: { select: { id: true, name: true, email: true } },
        members: { select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });

    const team = [
      { ...company.user, role: "OWNER" },
      ...company.members.map((m) => ({ ...m.user, role: m.role, since: m.createdAt })),
    ];
    return res.json({ yourRole: req.teamRole, team });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar a equipe." });
  }
}

// Cria o acesso de uma pessoa nova da equipe. Só o dono cria sócios; sócios criam analistas.
export async function add(req, res) {
  try {
    const parsed = memberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", details: parsed.error.issues.map((i) => i.message) });
    }
    const { name, email, password, role } = parsed.data;

    if (role === "SOCIO" && !isOwner(req)) {
      return res.status(403).json({ error: "Só o dono do escritório adiciona sócios." });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return res.status(400).json({ error: "Este e-mail já tem cadastro." });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        memberships: { create: { role, companyId: req.companyId } },
      },
      select: { id: true, name: true, email: true },
    });

    registerLog(req.companyId, req.actor, "CREATE", "EQUIPE", `Adicionou ${name} à equipe como ${role}`);
    return res.status(201).json({ ...user, role });
  } catch (err) {
    return res.status(400).json({ error: "Não foi possível adicionar a pessoa." });
  }
}

// Muda o perfil de alguém da equipe. Só o dono.
export async function changeRole(req, res) {
  try {
    if (!isOwner(req)) return res.status(403).json({ error: "Só o dono do escritório muda perfis." });

    const role = req.body.role;
    if (!ROLES.includes(role)) return res.status(400).json({ error: "Perfil deve ser SOCIO ou ANALISTA." });

    const result = await prisma.companyMember.updateMany({
      where: { companyId: req.companyId, userId: req.params.userId },
      data: { role },
    });
    if (result.count === 0) return res.status(404).json({ error: "Pessoa não encontrada na equipe." });

    registerLog(req.companyId, req.actor, "UPDATE", "EQUIPE", `Mudou um perfil da equipe para ${role}`);
    return res.json({ userId: req.params.userId, role });
  } catch (err) {
    return res.status(400).json({ error: "Não foi possível mudar o perfil." });
  }
}

// Tira alguém da equipe. O dono remove qualquer um; sócio remove só analistas.
// Se a pessoa não tinha acesso a mais nada, o login dela é apagado junto.
export async function remove(req, res) {
  try {
    const member = await prisma.companyMember.findFirst({
      where: { companyId: req.companyId, userId: req.params.userId },
      select: { id: true, role: true, user: { select: { name: true, _count: { select: { companies: true, memberships: true } } } } },
    });
    if (!member) return res.status(404).json({ error: "Pessoa não encontrada na equipe." });

    if (member.role === "SOCIO" && !isOwner(req)) {
      return res.status(403).json({ error: "Só o dono do escritório remove sócios." });
    }

    await prisma.companyMember.delete({ where: { id: member.id } });

    const { companies, memberships } = member.user._count;
    if (companies === 0 && memberships <= 1) {
      await prisma.user.delete({ where: { id: req.params.userId } });
    }

    registerLog(req.companyId, req.actor, "DELETE", "EQUIPE", `Removeu ${member.user.name} da equipe`);
    return res.json({ message: "Pessoa removida da equipe." });
  } catch (err) {
    return res.status(400).json({ error: "Não foi possível remover a pessoa." });
  }
}

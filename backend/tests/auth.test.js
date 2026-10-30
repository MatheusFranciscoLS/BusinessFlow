import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { api, prisma, resetDatabase, createUser, uniqueEmail, tokenFor } from "./helpers.js";
import * as authService from "../src/services/auth.service.js";

beforeAll(resetDatabase);

describe("cadastro (POST /api/auth/register)", () => {
  it("cria o usuário, guarda a senha criptografada e não devolve a senha", async () => {
    const email = uniqueEmail("novo");
    const res = await api()
      .post("/api/auth/register")
      .send({ name: "Maria Souza", email, password: "senha-segura" });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), name: "Maria Souza", email });
    expect(JSON.stringify(res.body)).not.toContain("senha-segura");

    const saved = await prisma.user.findUnique({ where: { email } });
    expect(saved.password).not.toBe("senha-segura");
    expect(saved.password).toMatch(/^\$2[aby]\$/); // formato do bcrypt
    expect(saved.role).toBe("ADMIN");
  });

  it("recusa e-mail que já existe", async () => {
    const existing = await createUser();
    const res = await api()
      .post("/api/auth/register")
      .send({ name: "Outra Pessoa", email: existing.email, password: "senha-segura" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/já está em uso/i);
  });

  it("a validação recusa nome curto, e-mail inválido e senha curta", async () => {
    const valid = { name: "Maria Souza", email: uniqueEmail(), password: "senha-segura" };

    await expect(authService.register({ ...valid, name: "Ma" })).rejects.toThrow();
    await expect(authService.register({ ...valid, email: "isso-nao-e-email" })).rejects.toThrow();
    await expect(authService.register({ ...valid, password: "123" })).rejects.toThrow();
    expect(await prisma.user.count({ where: { email: valid.email } })).toBe(0);
  });
});

describe("login (POST /api/auth/login)", () => {
  it("devolve token de acesso, refresh token e os dados do usuário (sem senha)", async () => {
    const user = await createUser({ role: "ADMIN" });
    const res = await api().post("/api/auth/login").send({ email: user.email, password: "senha123" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, email: user.email, role: "ADMIN" });
    expect(res.body.user.password).toBeUndefined();

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ id: user.id, email: user.email, role: "ADMIN" });

    const stored = await prisma.refreshToken.findUnique({ where: { token: res.body.refreshToken } });
    expect(stored.userId).toBe(user.id);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("o token do perfil CLIENT carrega a empresa a que ele tem acesso", async () => {
    const admin = await createUser();
    const company = await prisma.company.create({ data: { name: "Empresa X", userId: admin.id } });
    const portal = await createUser({ role: "CLIENT", companyAccessId: company.id });

    const res = await api().post("/api/auth/login").send({ email: portal.email, password: "senha123" });
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);

    expect(payload.role).toBe("CLIENT");
    expect(payload.companyAccessId).toBe(company.id);
  });

  it("recusa senha errada com 401", async () => {
    const user = await createUser();
    const res = await api().post("/api/auth/login").send({ email: user.email, password: "errada" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it("não revela se o e-mail existe: mesma mensagem para e-mail desconhecido e senha errada", async () => {
    const user = await createUser();
    const wrongPassword = await api().post("/api/auth/login").send({ email: user.email, password: "errada" });
    const unknownEmail = await api().post("/api/auth/login").send({ email: uniqueEmail("ninguem"), password: "qualquer" });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error).toBe(wrongPassword.body.error);
  });
});

describe("renovar e encerrar sessão (auth.service)", () => {
  it("troca um refresh token válido por um novo token de acesso", async () => {
    const user = await createUser();
    const { refreshToken } = await authService.login({ email: user.email, password: "senha123" });

    const { token } = await authService.refreshToken(refreshToken);
    expect(jwt.verify(token, process.env.JWT_SECRET).id).toBe(user.id);
  });

  it("recusa refresh token inexistente ou vazio", async () => {
    await expect(authService.refreshToken("nao-existe")).rejects.toThrow(/inválido/i);
    await expect(authService.refreshToken(undefined)).rejects.toThrow(/não informado/i);
  });

  it("recusa e apaga um refresh token vencido", async () => {
    const user = await createUser();
    await prisma.refreshToken.create({
      data: { token: "vencido-123", userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(authService.refreshToken("vencido-123")).rejects.toThrow(/expirado/i);
    expect(await prisma.refreshToken.count({ where: { token: "vencido-123" } })).toBe(0);
  });

  it("o logout apaga o refresh token, que deixa de funcionar", async () => {
    const user = await createUser();
    const { refreshToken } = await authService.login({ email: user.email, password: "senha123" });

    await authService.logout(refreshToken);

    await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
  });
});

describe("proteção das rotas (middleware de autenticação)", () => {
  it("rota protegida sem token devolve 401", async () => {
    const res = await api().get("/api/companies");
    expect(res.status).toBe(401);
  });

  it("recusa cabeçalho sem o token, token com assinatura errada e token vencido", async () => {
    const user = await createUser();

    const semToken = await api().get("/api/companies").set("Authorization", "Bearer");
    const assinaturaErrada = await api()
      .get("/api/companies")
      .set("Authorization", `Bearer ${jwt.sign({ id: user.id }, "outro-segredo")}`);
    const vencido = await api()
      .get("/api/companies")
      .set("Authorization", `Bearer ${tokenFor(user, { expiresIn: -10 })}`);

    expect(semToken.status).toBe(401);
    expect(assinaturaErrada.status).toBe(401);
    expect(vencido.status).toBe(401);
  });

  it("token válido passa", async () => {
    const user = await createUser();
    const res = await api().get("/api/companies").set("Authorization", `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(200);
  });
});

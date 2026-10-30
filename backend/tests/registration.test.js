import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { api, prisma, resetDatabase, uniqueEmail } from "./helpers.js";

const original = process.env.ALLOW_PUBLIC_REGISTRATION;

beforeAll(resetDatabase);
afterEach(() => {
  process.env.ALLOW_PUBLIC_REGISTRATION = original;
});

const newUser = () => ({ name: "Maria Souza", email: uniqueEmail("cadastro"), password: "senha-segura" });

describe("cadastro público", () => {
  it("fechado por padrão: recusa com 403 e não cria usuário", async () => {
    delete process.env.ALLOW_PUBLIC_REGISTRATION;
    const body = newUser();

    const res = await api().post("/api/auth/register").send(body);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cadastro está fechado/i);
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(0);
  });

  it("a tela de login descobre se o cadastro está aberto", async () => {
    delete process.env.ALLOW_PUBLIC_REGISTRATION;
    expect((await api().get("/api/auth/config")).body).toEqual({ registrationOpen: false });

    process.env.ALLOW_PUBLIC_REGISTRATION = "true";
    expect((await api().get("/api/auth/config")).body).toEqual({ registrationOpen: true });
  });

  it("aberto por variável de ambiente: cadastra normalmente", async () => {
    process.env.ALLOW_PUBLIC_REGISTRATION = "true";
    const body = newUser();

    const res = await api().post("/api/auth/register").send(body);

    expect(res.status).toBe(201);
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(1);
  });

  it("qualquer outro valor da variável mantém fechado", async () => {
    process.env.ALLOW_PUBLIC_REGISTRATION = "1";
    const res = await api().post("/api/auth/register").send(newUser());
    expect(res.status).toBe(403);
  });
});

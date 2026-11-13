import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// BUG-001 (qa/relatos-de-bug): rota inexistente devolvia a página HTML padrão do Express.
describe("rota inexistente", () => {
  it("GET responde 404 em JSON", async () => {
    const res = await api().get("/api/rota-que-nao-existe");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Rota não encontrada." });
  });

  it("POST também responde 404 em JSON", async () => {
    const res = await api().post("/api/outra-rota-que-nao-existe").send({});
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("não atrapalha rotas que existem (sem token continua 401)", async () => {
    const res = await api().get("/api/clients");
    expect(res.status).toBe(401);
  });
});

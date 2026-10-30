import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, authHeaders, uniqueEmail } from "./helpers.js";

let a, b, portalA, otherClientA, otherPortalA;

beforeAll(async () => {
  await resetDatabase();
  a = await createOffice("TA");
  b = await createOffice("TB");
  portalA = await createPortalUser(a.company, a.client);
  otherClientA = await prisma.client.create({
    data: { fullName: "Outro cliente A", email: uniqueEmail("outro-t"), companyId: a.company.id },
  });
  otherPortalA = await createPortalUser(a.company, otherClientA);
});

const newTicket = (clientId, companyId) =>
  prisma.ticket.create({
    data: { subject: "Dúvida", department: "Fiscal", description: "texto", clientId, companyId },
  });

describe("tarefas", () => {
  const newTask = (companyId, clientId = null) =>
    prisma.task.create({ data: { title: "Tarefa", dueDate: new Date(), companyId, clientId } });

  it("o gestor não altera nem apaga tarefa de outra empresa", async () => {
    const taskB = await newTask(b.company.id);
    const headers = authHeaders(a.admin, a.company.id);

    const update = await api().put(`/api/tasks/${taskB.id}`).set(headers).send({ status: "CONCLUIDO" });
    const remove = await api().delete(`/api/tasks/${taskB.id}`).set(headers);

    expect([update.status, remove.status]).toEqual([404, 404]);
    const unchanged = await prisma.task.findUnique({ where: { id: taskB.id } });
    expect(unchanged.status).toBe("A_FAZER");
  });

  it("o gestor altera e apaga tarefa da própria empresa", async () => {
    const task = await newTask(a.company.id);
    const headers = authHeaders(a.admin, a.company.id);

    const update = await api().put(`/api/tasks/${task.id}`).set(headers).send({ status: "CONCLUIDO" });
    expect(update.status).toBe(200);
    expect(update.body.status).toBe("CONCLUIDO");

    const remove = await api().delete(`/api/tasks/${task.id}`).set(headers);
    expect(remove.status).toBe(200);
  });

  it("o cliente do portal só consulta: não cria, altera nem apaga", async () => {
    const task = await newTask(a.company.id, a.client.id);
    const headers = authHeaders(portalA);

    const create = await api().post("/api/tasks").set(headers).send({ title: "x", dueDate: "2026-12-01" });
    const update = await api().put(`/api/tasks/${task.id}`).set(headers).send({ status: "CONCLUIDO" });
    const remove = await api().delete(`/api/tasks/${task.id}`).set(headers);
    const read = await api().get("/api/tasks").set(headers);

    expect([create.status, update.status, remove.status]).toEqual([403, 403, 403]);
    expect(read.status).toBe(200);
    expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull();
  });

  it("não cria tarefa para cliente de outra empresa", async () => {
    const res = await api()
      .post("/api/tasks")
      .set(authHeaders(a.admin, a.company.id))
      .send({ title: "x", dueDate: "2026-12-01", clientId: b.client.id });
    expect(res.status).toBe(400);
  });
});

describe("chamados", () => {
  it("o cliente abre chamado só em nome dele, mesmo informando outro cliente e outro perfil", async () => {
    const res = await api()
      .post("/api/tickets")
      .set(authHeaders(portalA))
      .send({ subject: "Ajuda", department: "Fiscal", description: "d", clientId: otherClientA.id, role: "ADMIN" });

    expect(res.status).toBe(201);
    expect(res.body.clientId).toBe(a.client.id);
    expect(res.body.hasUnreadAdmin).toBe(true);
  });

  it("o gestor não abre chamado para cliente de outra empresa", async () => {
    const res = await api()
      .post("/api/tickets")
      .set(authHeaders(a.admin, a.company.id))
      .send({ subject: "x", department: "Fiscal", description: "d", clientId: b.client.id });
    expect(res.status).toBe(400);
  });

  it("não responde, marca como lido nem muda o status de chamado de outra empresa", async () => {
    const ticketB = await newTicket(b.client.id, b.company.id);
    const headers = authHeaders(a.admin, a.company.id);

    const message = await api().post(`/api/tickets/${ticketB.id}/messages`).set(headers).send({ message: "oi" });
    const read = await api().put(`/api/tickets/${ticketB.id}/read`).set(headers).send({});
    const status = await api().put(`/api/tickets/${ticketB.id}/status`).set(headers).send({ status: "FECHADO" });

    expect([message.status, read.status, status.status]).toEqual([404, 404, 404]);
    expect(await prisma.ticketMessage.count({ where: { ticketId: ticketB.id } })).toBe(0);
    expect((await prisma.ticket.findUnique({ where: { id: ticketB.id } })).status).toBe("ABERTO");
  });

  it("o cliente não mexe em chamado de outro cliente da mesma empresa", async () => {
    const ticket = await newTicket(a.client.id, a.company.id);
    const res = await api()
      .post(`/api/tickets/${ticket.id}/messages`)
      .set(authHeaders(otherPortalA))
      .send({ message: "intruso" });
    expect(res.status).toBe(404);
  });

  it("a mensagem usa o nome e o perfil reais, não os do corpo da requisição", async () => {
    const ticket = await newTicket(a.client.id, a.company.id);
    const res = await api()
      .post(`/api/tickets/${ticket.id}/messages`)
      .set(authHeaders(portalA))
      .send({ message: "oi", senderName: "Gestor Falso", senderRole: "ADMIN" });

    expect(res.status).toBe(201);
    expect(res.body.senderName).toBe(portalA.name);
    expect(res.body.senderRole).toBe("CLIENT");
  });

  it("o cliente do portal não muda o status do chamado; o gestor muda", async () => {
    const ticket = await newTicket(a.client.id, a.company.id);

    const asClient = await api().put(`/api/tickets/${ticket.id}/status`).set(authHeaders(portalA)).send({ status: "FECHADO" });
    expect(asClient.status).toBe(403);

    const asManager = await api().put(`/api/tickets/${ticket.id}/status`).set(authHeaders(a.admin, a.company.id)).send({ status: "FECHADO" });
    expect(asManager.status).toBe(200);
    expect(asManager.body.status).toBe("FECHADO");
  });
});

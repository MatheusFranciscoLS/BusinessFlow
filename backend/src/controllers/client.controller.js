import * as clientService from "../services/client.service.js";

export async function create(req, res) {
  try {
    const result = await clientService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  const clients = await clientService.getAll();
  res.json(clients);
}

export async function getById(req, res) {
  try {
    const client = await clientService.getById(req.params.id);
    res.json(client);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const client = await clientService.update(req.params.id, req.body);
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await clientService.remove(req.params.id);
    res.json({ message: "Cliente removido com sucesso" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

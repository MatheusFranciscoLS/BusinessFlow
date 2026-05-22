import * as clientService from "../services/client.service.js";

export async function create(req, res) {
  try {
    const result = await clientService.create(req.body, req.user.id);
    return res.status(201).json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function getAll(req, res) {
  try {
    const clients = await clientService.getAll(req.user.id);
    return res.status(200).json(clients);
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function getById(req, res) {
  try {
    const client = await clientService.getById(req.params.id, req.user.id);
    return res.status(200).json(client);
  } catch (err) { return res.status(404).json({ error: err.message }); }
}
export async function update(req, res) {
  try {
    const client = await clientService.update(req.params.id, req.body, req.user.id);
    return res.status(200).json(client);
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function remove(req, res) {
  try {
    await clientService.remove(req.params.id, req.user.id);
    return res.status(200).json({ message: "Cliente removido com sucesso." });
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
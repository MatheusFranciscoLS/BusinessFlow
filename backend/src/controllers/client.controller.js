import * as clientService from "../services/client.service.js";

export async function create(req, res) {
  try {
    // 🔥 Agora usamos req.companyId em vez de req.user.id
    const data = await clientService.createClient(req.companyId, req.body);
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const data = await clientService.getAllClients(req.companyId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const data = await clientService.getClientById(
      req.companyId,
      req.params.id,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const data = await clientService.updateClient(
      req.companyId,
      req.params.id,
      req.body,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await clientService.deleteClient(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

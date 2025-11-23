import * as appointmentService from "../services/appointment.service.js";

export async function create(req, res) {
  try {
    const appt = await appointmentService.create(req.body);
    res.status(201).json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  const list = await appointmentService.getAll();
  res.json(list);
}

export async function getById(req, res) {
  try {
    const appt = await appointmentService.getById(req.params.id);
    res.json(appt);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const appt = await appointmentService.update(req.params.id, req.body);
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await appointmentService.remove(req.params.id);
    res.json({ message: "Agendamento removido com sucesso" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

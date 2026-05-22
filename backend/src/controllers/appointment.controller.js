import * as appointmentService from "../services/appointment.service.js";

export async function create(req, res) {
  try {
    const appt = await appointmentService.create(req.body, req.user.id);
    return res.status(201).json(appt);
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function getAll(req, res) {
  try {
    const list = await appointmentService.getAll(req.user.id);
    return res.status(200).json(list);
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function getById(req, res) {
  try {
    const appt = await appointmentService.getById(req.params.id, req.user.id);
    return res.status(200).json(appt);
  } catch (err) { return res.status(404).json({ error: err.message }); }
}
export async function update(req, res) {
  try {
    const appt = await appointmentService.update(req.params.id, req.body, req.user.id);
    return res.status(200).json(appt);
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function remove(req, res) {
  try {
    await appointmentService.remove(req.params.id, req.user.id);
    return res.status(200).json({ message: "Agendamento removido com sucesso." });
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
import * as appointmentService from "../services/appointment.service.js";

export async function create(req, res) {
  try {
    const data = await appointmentService.createAppointment(
      req.companyId,
      req.body,
    );
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
export async function getAll(req, res) {
  try {
    const data = await appointmentService.getAllAppointments(req.companyId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
export async function getById(req, res) {
  try {
    const data = await appointmentService.getAppointmentById(
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
    const data = await appointmentService.updateAppointment(
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
    await appointmentService.deleteAppointment(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

import * as dashboardService from "../services/dashboard.service.js";

export async function getSummary(req, res) {
  try {
    // 🔥 Agora ele captura o período (ex: '7dias', 'mes', 'ano') da URL
    const { period } = req.query;
    const data = await dashboardService.getSummary(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function byCategory(req, res) {
  try {
    const { period } = req.query;
    const data = await dashboardService.byCategory(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function daily(req, res) {
  try {
    const { period } = req.query;
    const data = await dashboardService.daily(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function monthly(req, res) {
  try {
    const { period } = req.query;
    const data = await dashboardService.monthly(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function topClients(req, res) {
  try {
    const { period } = req.query;
    const data = await dashboardService.topClients(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function recent(req, res) {
  try {
    const { period } = req.query;
    const data = await dashboardService.recent(req.user.id, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

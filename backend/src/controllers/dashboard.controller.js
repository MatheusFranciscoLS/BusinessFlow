import * as dashboardService from "../services/dashboard.service.js";

export async function getSummary(req, res) {
  try {
    // 🔥 Capturamos o clientId para isolamento de dados
    const { period, clientId } = req.query;
    const data = await dashboardService.getSummary(
      req.companyId,
      period,
      clientId,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function byCategory(req, res) {
  try {
    const { period, clientId } = req.query;
    const data = await dashboardService.byCategory(
      req.companyId,
      period,
      clientId,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function daily(req, res) {
  try {
    const { period, clientId } = req.query;
    const data = await dashboardService.daily(req.companyId, period, clientId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function monthly(req, res) {
  try {
    const { period, clientId } = req.query;
    const data = await dashboardService.monthly(
      req.companyId,
      period,
      clientId,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function topClients(req, res) {
  try {
    const { period } = req.query;
    // Top Clients é uma função exclusiva do Gestor, o cliente nunca acessa, então não precisa de clientId
    const data = await dashboardService.topClients(req.companyId, period);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function recent(req, res) {
  try {
    const { period, clientId } = req.query;
    const data = await dashboardService.recent(req.companyId, period, clientId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

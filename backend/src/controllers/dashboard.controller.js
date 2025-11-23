import * as dashboardService from "../services/dashboard.service.js";

export async function getSummary(req, res) {
  try {
    const data = await dashboardService.getSummary();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}


export async function byCategory(req, res) {
  try {
    const data = await dashboardService.byCategory();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function daily(req, res) {
  try {
    const data = await dashboardService.daily();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function monthly(req, res) {
  try {
    const data = await dashboardService.monthly();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function topClients(req, res) {
  try {
    const data = await dashboardService.topClients();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function recent(req, res) {
  try {
    const data = await dashboardService.recent();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

import * as fees from "../services/fees.service.js";
import { registerLog } from "../services/audit.service.js";

export async function generate(req, res) {
  try {
    const { month, year, dueDay } = req.body;
    const result = await fees.generateMonthlyFees(req.companyId, month, year, dueDay);

    registerLog(
      req.companyId,
      req.actor,
      "CREATE",
      "HONORÁRIOS",
      `Gerou os honorários de ${result.reference}: ${result.created} novos, ${result.skipped} já existiam`,
    );
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function overdue(req, res) {
  try {
    return res.json(await fees.overdue(req.companyId));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function syncStatus(req, res) {
  try {
    return res.json(await fees.syncDelinquency(req.companyId));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

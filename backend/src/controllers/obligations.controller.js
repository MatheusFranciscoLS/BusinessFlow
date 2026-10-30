import * as obligations from "../services/obligations.service.js";
import { registerLog } from "../services/audit.service.js";

export async function rules(req, res) {
  return res.json(obligations.listRules());
}

export async function generate(req, res) {
  try {
    const { month, year } = req.body;
    const result = await obligations.generateObligations(req.companyId, month, year);

    registerLog(
      req.companyId,
      req.actor,
      "CREATE",
      "OBRIGAÇÕES",
      `Gerou as obrigações que vencem em ${month}/${year}: ${result.created} tarefas novas, ${result.skipped} já existiam`,
    );
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

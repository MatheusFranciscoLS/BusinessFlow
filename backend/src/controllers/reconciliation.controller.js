import * as reconciliation from "../services/reconciliation.service.js";
import { registerLog } from "../services/audit.service.js";

const fail = (res, err) => res.status(err.status || 400).json({ error: err.message });

export async function suggest(req, res) {
  try {
    const result = await reconciliation.suggest(req.companyId, req.body.movements);
    return res.json(result);
  } catch (err) {
    return fail(res, err);
  }
}

export async function confirm(req, res) {
  try {
    const { bank, transactionIds, allowDifference } = req.body;
    const result = await reconciliation.confirm(req.companyId, {
      bank,
      transactionIds,
      allowDifference: allowDifference === true,
    });

    registerLog(
      req.companyId,
      req.actor,
      "UPDATE",
      "CONCILIAÇÃO",
      `Concilou ${result.reconciled} lançamento(s) com o movimento do banco: ${bank.description || bank.id}`,
    );
    return res.json(result);
  } catch (err) {
    return fail(res, err);
  }
}

export async function createFromBank(req, res) {
  try {
    const transaction = await reconciliation.createFromBank(req.companyId, req.body);

    registerLog(
      req.companyId,
      req.actor,
      "CREATE",
      "CONCILIAÇÃO",
      `Lançou a partir do extrato: ${transaction.title} (R$ ${transaction.amount})`,
    );
    return res.status(201).json(transaction);
  } catch (err) {
    return fail(res, err);
  }
}

export async function undo(req, res) {
  try {
    const result = await reconciliation.undo(req.companyId, req.body.transactionId);

    registerLog(
      req.companyId,
      req.actor,
      "UPDATE",
      "CONCILIAÇÃO",
      `Desfez uma conciliação (${result.restored} voltaram a pendente, ${result.removed} removidos)`,
    );
    return res.json(result);
  } catch (err) {
    return fail(res, err);
  }
}

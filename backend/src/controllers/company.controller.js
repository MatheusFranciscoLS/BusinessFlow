import * as companyService from "../services/company.service.js";

export async function create(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    const company = await companyService.createCompany(userId, req.body);
    return res.status(201).json(company);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    const companies = await companyService.getUserCompanies(userId);
    return res.json(companies);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    const company = await companyService.updateCompany(
      userId,
      req.params.id,
      req.body,
    );
    return res.json(company);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    await companyService.deleteCompany(userId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

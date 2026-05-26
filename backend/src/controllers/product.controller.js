import * as productService from "../services/product.service.js";

export async function create(req, res) {
  try {
    const images = req.files
      ? req.files.map((f) => `/uploads/products/${f.filename}`)
      : [];
    const data = await productService.createProduct(
      req.companyId,
      req.body,
      images,
    );
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
export async function getAll(req, res) {
  try {
    const data = await productService.getAllProducts(req.companyId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
export async function getById(req, res) {
  try {
    const data = await productService.getProductById(
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
    const images = req.files
      ? req.files.map((f) => `/uploads/products/${f.filename}`)
      : [];
    const data = await productService.updateProduct(
      req.companyId,
      req.params.id,
      req.body,
      images,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
export async function remove(req, res) {
  try {
    await productService.deleteProduct(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

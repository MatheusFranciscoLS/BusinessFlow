import * as productService from "../services/product.service.js";

export async function create(req, res) {
  try {
    const data = req.body;
    const images = req.files?.map((file) => `/uploads/products/${file.filename}`) || [];
    const product = await productService.create({
      ...data,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
    }, images, req.user.id);

    return res.status(201).json(product);
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function getAll(req, res) {
  try {
    const products = await productService.getAll(req.user.id);
    return res.json(products);
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function getById(req, res) {
  try {
    const product = await productService.getById(req.params.id, req.user.id);
    return res.json(product);
  } catch (err) { return res.status(404).json({ error: err.message }); }
}
export async function update(req, res) {
  try {
    let imageUrls = undefined;
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => `/uploads/products/${file.filename}`);
    }
    const product = await productService.updateProduct(req.params.id, req.body, imageUrls, req.user.id);
    return res.json(product);
  } catch (error) { return res.status(400).json({ error: error.message }); }
}
export async function remove(req, res) {
  try {
    await productService.remove(req.params.id, req.user.id);
    return res.json({ message: "Produto removido com sucesso" });
  } catch (err) { return res.status(400).json({ error: err.message }); }
}
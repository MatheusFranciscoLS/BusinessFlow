import * as productService from "../services/product.service.js";

export async function create(req, res) {
  try {
    const data = req.body;

    // Transformar imagens enviadas pelo Multer
    const images = req.files?.map(file => `/uploads/products/${file.filename}`) || [];

    const product = await productService.create({
      ...data,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      images
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  const products = await productService.getAll();
  return res.json(products);
}

export async function getById(req, res) {
  try {
    const product = await productService.getById(req.params.id);
    return res.json(product);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    // Verifica se houve upload de novas imagens
    // Se houver, cria o array de URLs. Se não, manda null/undefined.
    let imageUrls = undefined;
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `http://localhost:3001/uploads/${file.filename}`);
    }

    const product = await productService.updateProduct(id, data, imageUrls);
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function remove(req, res) {
  try {
    await productService.remove(req.params.id);
    return res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

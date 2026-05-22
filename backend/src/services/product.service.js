import prisma from "../config/prisma.js";

export async function create(data, imageUrls = [], userId) {
  const imagesData = imageUrls.map(url => ({ url }));

  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description || data.category,
      price: parseFloat(data.price),
      category: data.category,
      stock: parseInt(data.stock || 0),
      userId, // Salva com o ID do dono
      images: { create: imagesData }
    },
    include: { images: true },
  });
}

export async function getAll(userId) {
  return prisma.product.findMany({
    where: { userId }, // Filtra só os produtos dessa empresa
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id, userId) {
  const product = await prisma.product.findFirst({
    where: { id, userId }, include: { images: true }
  });
  if (!product) throw new Error("Produto não encontrado ou acesso negado.");
  return product;
}

export async function updateProduct(id, data, imageUrls, userId) {
  await getById(id, userId); // Trava de segurança

  const updateData = {
    name: data.name,
    description: data.description || data.category,
    category: data.category,
    price: data.price ? parseFloat(data.price) : undefined,
    stock: data.stock ? parseInt(data.stock) : undefined,
  };

  if (imageUrls && imageUrls.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    updateData.images = { create: imageUrls.map(url => ({ url })) };
  }

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: { images: true },
  });
}

export async function remove(id, userId) {
  await getById(id, userId); // Trava de segurança
  return prisma.product.delete({ where: { id } });
}
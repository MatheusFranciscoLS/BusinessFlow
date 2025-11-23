import prisma from "../config/prisma.js";

export async function create(data, imageUrls = []) {
  const imagesData = imageUrls.map(url => ({ url }));

  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description || data.category,
      price: parseFloat(data.price),
      category: data.category,
      stock: parseInt(data.stock || 0),
      images: {
        create: imagesData
      }
    },
    include: { images: true },
  });
}

export async function getAll() {
  return prisma.product.findMany({
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateProduct(id, data, imageUrls) {
  const updateData = {
    name: data.name,
    description: data.description || data.category,
    category: data.category,
    price: data.price ? parseFloat(data.price) : undefined,
    stock: data.stock ? parseInt(data.stock) : undefined,
  };

  // --- A CORREÇÃO MÁGICA ESTÁ AQUI ---
  if (imageUrls && imageUrls.length > 0) {
    // 1. Primeiro, deletamos todas as imagens antigas desse produto
    await prisma.productImage.deleteMany({
      where: { productId: id }
    });

    // 2. Depois, adicionamos a nova (que agora será a images[0])
    updateData.images = {
      create: imageUrls.map(url => ({ url }))
    };
  }

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: { images: true },
  });
}

export async function remove(id) {
  return prisma.product.delete({ where: { id } });
}
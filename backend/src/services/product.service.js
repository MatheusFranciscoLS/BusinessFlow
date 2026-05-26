import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createProduct(companyId, data, imagePaths) {
  return prisma.product.create({
    data: {
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      stock: parseInt(data.stock || 0),
      companyId, // 🔥 Vinculado à empresa atual!
      images: { create: imagePaths.map((url) => ({ url })) },
    },
    include: { images: true },
  });
}
export async function getAllProducts(companyId) {
  return prisma.product.findMany({
    where: { companyId },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
}
export async function getProductById(companyId, id) {
  const prod = await prisma.product.findFirst({
    where: { id, companyId },
    include: { images: true },
  });
  if (!prod) throw new Error("Produto não encontrado.");
  return prod;
}
export async function updateProduct(companyId, id, data, imagePaths) {
  const prod = await prisma.product.findFirst({ where: { id, companyId } });
  if (!prod) throw new Error("Produto não encontrado.");

  const updateData = {
    name: data.name,
    category: data.category,
    price: data.price ? parseFloat(data.price) : undefined,
    stock: data.stock ? parseInt(data.stock) : undefined,
  };

  if (imagePaths && imagePaths.length > 0) {
    await prisma.image.deleteMany({ where: { productId: id } });
    updateData.images = { create: imagePaths.map((url) => ({ url })) };
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { images: true },
  });
}
export async function deleteProduct(companyId, id) {
  const prod = await prisma.product.findFirst({ where: { id, companyId } });
  if (!prod) throw new Error("Produto não encontrado.");
  return prisma.product.delete({ where: { id } });
}

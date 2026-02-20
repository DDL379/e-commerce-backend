import prisma from "../configs/prisma.config.js";

export const productService = {
  async getAll(category) {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: { name: "asc" },
    });
  },

  async getAllProductsAdmin() {
    return await prisma.product.findMany({
      orderBy: { id: "asc" },
    });
  },

  async createProduct(data) {
    return await prisma.product.create({
      data: {
        name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        img: data.img || null,
        isActive: true,
        baseIngredients: data.baseIngredients || [],
      },
    });
  },

  async update(id, data) {
    // แยกฟิลด์ที่ไม่ต้องการให้ Update ตรงๆ ออกมา (ถ้ามี)
    const { id: _, ...updateData } = data;

    return await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        price: data.price ? parseFloat(data.price) : undefined,
        baseIngredients:
          data.baseIngredients !== undefined ? data.baseIngredients : undefined,
      },
    });
  },

  async remove(id) {
    return await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
  },
};

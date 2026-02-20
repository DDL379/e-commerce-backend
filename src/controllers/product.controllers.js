import { productService } from "../services/product.service.js";

export const productController = {
  async getAll(req, res, next) {
    try {
      const { category } = req.query;
      const products = await productService.getAll(category);
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, price, category, img, baseIngredients } = req.body;

      const productData = {
        name,
        price,
        category,
        img,
        baseIngredients: Array.isArray(baseIngredients) ? baseIngredients : [],
      };

      const product = await productService.createProduct(productData);
      res.status(201).json({ message: "เพิ่มเมนูสำเร็จ", data: product });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // ✅ ถ้ามีการส่ง baseIngredients มา ต้องเช็คว่าเป็น Array
      if (
        updateData.baseIngredients &&
        !Array.isArray(updateData.baseIngredients)
      ) {
        updateData.baseIngredients = [updateData.baseIngredients];
      }

      const product = await productService.update(id, updateData);
      res.json({ message: "อัปเดตเมนูสำเร็จ", data: product });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;

      await productService.remove(id);

      res.json({
        status: "success",
        message: "ลบรายการอาหารเรียบร้อย (ปิดการใช้งาน)",
      });
    } catch (error) {
      next(error);
    }
  },
};

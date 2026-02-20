import { z } from "zod";

export const productSchema = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "กรุณากรอกชื่ออาหาร"),
      price: z.number().positive("ราคาต้องมากกว่า 0"),
      category: z.enum(["ก๋วยเตี๋ยว", "ของกินเล่น", "เครื่องดื่ม"], {
        error_map: () => ({ message: "กรุณาเลือกหมวดหมู่ที่ถูกต้อง" }),
      }),
      img: z
        .string()
        .url("รูปแบบ URL รูปภาพไม่ถูกต้อง")
        .optional()
        .or(z.literal("")),
      // ✅ เพิ่มการตรวจสอบ baseIngredients
      baseIngredients: z.array(z.string()).optional().default([]), // ตรวจสอบว่าเป็น Array ของ String และกำหนดค่าเริ่มต้นเป็น Array ว่าง
    }),
  }),

  update: z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/, "ID ต้องเป็นตัวเลขเท่านั้น"),
    }),
    body: z.object({
      name: z.string().min(1, "กรุณากรอกชื่ออาหาร").optional(),
      price: z.number().positive("ราคาต้องมากกว่า 0").optional(),
      category: z.enum(["ก๋วยเตี๋ยว", "ของกินเล่น", "เครื่องดื่ม"]).optional(),
      img: z
        .string()
        .url("รูปแบบ URL รูปภาพไม่ถูกต้อง")
        .optional()
        .or(z.literal("")),
      baseIngredients: z.array(z.string()).optional(), // รองรับการแก้ไขวัตถุดิบ
      isActive: z.boolean().optional(),
    }),
  }),

  getAll: z.object({
    query: z.object({
      category: z.string().optional(),
    }),
  }),

  byId: z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/, "ID ต้องเป็นตัวเลขเท่านั้น"),
    }),
  }),
};

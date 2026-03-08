import { z } from "zod";

export const orderSchema = {
  addItems: z.object({
    body: z.object({
      orderId: z.coerce.number({ required_error: "ต้องระบุ ID ของบิล" }),

      cartItems: z
        .array(
          z.object({
            name: z.string().min(1, "ต้องมีชื่ออาหาร"),
            quantity: z.coerce.number().int().positive(),
            price: z.coerce.number(), // ✅ ตรงนี้เราปลดล็อกให้ติดลบได้แล้วสำหรับส่วนลด

            options: z.any().optional().default({}),
          }),
        )
        .min(1, "ต้องมีอาหารอย่างน้อย 1 รายการ"),
    }),
  }),
  checkout: z.object({
    params: z.object({
      id: z.coerce.number({
        invalid_type_error: "ID ของบิลต้องเป็นตัวเลขเท่านั้น",
      }),
    }),
    body: z.object({
      // ✅ เปลี่ยนจาก enum เป็น string ธรรมดา เพื่อรองรับการรับข้อความยาวๆ แบบ SPLIT_CASH=...
      paymentMethod: z
        .string({
          required_error: "กรุณาระบุวิธีการชำระเงิน",
        })
        .min(1, "ต้องระบุวิธีการชำระเงิน"),

      totalAmount: z.coerce.number().nonnegative().optional(),
    }),
  }),
};

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
            price: z.coerce.number().nonnegative(),

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
      paymentMethod: z.enum(["CASH", "TRANSFER"], {
        error_map: () => ({
          message: "รองรับเฉพาะ CASH หรือ TRANSFER เท่านั้น",
        }),
      }),
      totalAmount: z.coerce.number().nonnegative().optional(),
    }),
  }),
};

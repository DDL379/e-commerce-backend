import { Router } from "express";
import { orderController } from "../controllers/order.controllers.js";
import { validate } from "../middlewares/validate.middleware.js";
import { orderSchema } from "../validations/order.schema.js";
const orderRouter = Router();

orderRouter.get("/table/:tableNumber", orderController.getOrCreateOrder);

orderRouter.post(
  "/add-items",
  validate(orderSchema.addItems),
  orderController.addItems,
);

orderRouter.patch(
  "/:id/checkout",
  validate(orderSchema.checkout),
  orderController.checkout,
);

orderRouter.get("/history", orderController.getOrderHistory);

orderRouter.get("/tables-status", orderController.getTablesStatus);

orderRouter.patch("/item/:itemId", orderController.updateOrderItem);

orderRouter.delete("/item/:itemId", orderController.removeOrderItem);

orderRouter.get("/:id/receipt", orderController.getReceipt);

orderRouter.delete("/:id", orderController.deleteOrder);

export default orderRouter;

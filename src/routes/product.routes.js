import { Router } from "express";
import { productController } from "../controllers/product.controllers.js";
import { validate } from "../middlewares/validate.middleware.js";
import { productSchema } from "../validations/product.schema.js";

const productRouter = Router();

productRouter.get(
  "/",
  validate(productSchema.getAll),
  productController.getAll,
);

productRouter.post(
  "/",
  validate(productSchema.create),
  productController.create,
);

productRouter.patch(
  "/:id",
  validate(productSchema.byId),
  productController.update,
);

productRouter.delete(
  "/:id",
  validate(productSchema.byId),
  productController.remove,
);

export default productRouter;

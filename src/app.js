import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorMiddleware from "./middlewares/error.middleware.js";
import notFoundMiddleware from "./middlewares/not-found.middleware.js";
import orderRouter from "./routes/order.routes.js";
import productRouter from "./routes/product.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(errorMiddleware);
app.use(notFoundMiddleware);

export default app;

import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controllers.js";

const dashboardRouter = Router();

dashboardRouter.get("/daily", dashboardController.getSummary);

export default dashboardRouter;

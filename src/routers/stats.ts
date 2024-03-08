import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../contollers/stats.js";

const app = express.Router();

// route - /api/v1/dashboard/{api-name}
app
  .get("/stats", isAdmin, getDashboardStats)
  .get("/pie", isAdmin, getPieCharts)
  .get("/bar", isAdmin, getBarCharts)
  .get("/line", isAdmin, getLineCharts)

export default app;

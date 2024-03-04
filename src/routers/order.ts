import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../contollers/order.js";

const app = express.Router();

// route - /api/v1/order/{user api name}
app
  .post("/new", newOrder)
  .get("/my", myOrders)
  .get("/all", isAdmin, allOrders)
  .get("/:id", getSingleOrder)
  .put("/:id", isAdmin, processOrder)
  .delete("/:id", isAdmin, deleteOrder);

export default app;

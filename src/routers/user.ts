import express from "express";
import {
  newUser,
  getAllUsers,
  getUser,
  deleteUser,
} from "../contollers/user.js";
import { isAdmin } from "../middlewares/auth.js";

const app = express.Router();

// route - /api/v1/user/{user api name}
app
  .post("/new", newUser)
  .get("/all", isAdmin, getAllUsers)
  .get("/:id", getUser)
  .delete("/:id", isAdmin, deleteUser);

export default app;

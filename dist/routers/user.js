import express from "express";
import { newUser, getAllUsers, getUser, deleteUser, } from "../contollers/user.js";
const app = express.Router();
// route - /api/v1/user/{user api name}
app
    .post("/new", newUser)
    .get("/all", getAllUsers)
    .get("/:id", getUser)
    .delete("/:id", deleteUser);
export default app;

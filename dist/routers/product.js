import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getLatestProducts, getAllProducts, getSingleProduct, newProduct, updateProduct, } from "../contollers/product.js";
import { singleUpload } from "../middlewares/multer.js";
const app = express.Router();
// route - /api/v1/product/{product api name}
app
    .post("/new", isAdmin, singleUpload, newProduct)
    .get("/latest", getLatestProducts)
    .get("/all", getAllProducts)
    .get("/categories", getAllCategories)
    .get("/admin-products", isAdmin, getAdminProducts)
    .get("/:id", getSingleProduct)
    .delete("/:id", isAdmin, deleteProduct)
    .put("/:id", isAdmin, singleUpload, updateProduct);
export default app;

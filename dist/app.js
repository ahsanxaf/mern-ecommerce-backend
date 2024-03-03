import express from "express";
const port = 8080;
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRoute from "./routers/user.js";
import productRoute from "./routers/product.js";
import NodeCache from "node-cache";
connectDB();
export const nodeCache = new NodeCache();
const app = express();
app.use(express.json());
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use('/uploads', express.static('uploads'));
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`Server Started on port ${port}`);
});

import mongoose from "mongoose";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";
export const connectDB = async (uri) => {
    await mongoose
        .connect(uri, {
        dbName: "Ecommerce_24",
    })
        .then((c) => console.log(`Database connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};
export const invalidateCache = async ({ product, order, admin, }) => {
    if (product) {
        const productKeys = [
            "latest-products",
            "categories",
            "adminProducts",
        ];
        const products = await Product.find({}).select("_id");
        products.forEach((i) => {
            productKeys.push(`product-${i._id}`);
        });
        nodeCache.del(productKeys);
    }
    if (order) {
    }
    if (admin) {
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
            throw new Error('No Product Found');
        }
        product.stock -= order.quantity;
        await product.save();
    }
};

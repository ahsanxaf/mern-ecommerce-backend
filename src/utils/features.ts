import mongoose from "mongoose";
import { InvalidateCacheProps } from "../types/types.js";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";

export const connectDB = async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017", {
      dbName: "Ecommerce_24",
    })
    .then((c) => console.log(`Database connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidateCache = async ({
  product,
  order,
  admin,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
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

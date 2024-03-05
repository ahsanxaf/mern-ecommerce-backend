import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestbody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import { rm } from "fs";
import { faker } from "@faker-js/faker";
import { nodeCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";

export const getLatestProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let latestProducts;
    if (nodeCache.has("latest-products")) {
      latestProducts = JSON.parse(nodeCache.get("latest-products") as string);
    } else {
      latestProducts = await Product.find({}).sort({ createdAt: -1 }).limit(5);

      nodeCache.set("latest-products", JSON.stringify(latestProducts));
    }

    return res.status(200).json({
      success: true,
      latestProducts,
    });
  }
);

export const getAllCategories = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let categories;
    if (nodeCache.has("categories")) {
      categories = JSON.parse(nodeCache.get("categories") as string);
    } else {
      categories = await Product.distinct("category");
      nodeCache.set("categories", JSON.stringify(categories));
    }

    return res.status(201).json({
      success: true,
      categories,
    });
  }
);

export const getAdminProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let adminProducts;
    if (nodeCache.has("adminProducts")) {
      adminProducts = JSON.parse(nodeCache.get("adminProducts") as string);
    } else {
      adminProducts = await Product.find({});
      nodeCache.set("adminProducts", JSON.stringify(adminProducts));
    }

    return res.status(201).json({
      success: true,
      adminProducts,
    });
  }
);

export const getSingleProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let product;
    const id = req.params.id;
    if (nodeCache.has(`product-${id}`)) {
      product = JSON.parse(nodeCache.get(`product-${id}`) as string);
    } else {
      product = await Product.findById(id);
      nodeCache.set(`product-${id}`, JSON.stringify(product));
    }

    if (!product) {
      return next(
        new ErrorHandler("Invalid Product Id, No product found", 404)
      );
    }

    return res.status(201).json({
      success: true,
      product,
    });
  }
);

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestbody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!name || !price || !stock || !category) {
      rm(photo?.path || "", () => {
        console.log("Deleted");
      });
      return next(new ErrorHandler("Please Fill all the Fields", 400));
    }

    if (!photo) {
      return next(new ErrorHandler("Please Add Product Photo", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category,
      photo: photo?.path,
    });

    await invalidateCache({ product: true });

    return res.status(201).json({
      success: true,
      message: `New Product Added Successfully`,
    });
  }
);

export const updateProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    const product = await Product.findById(id);
    if (!product) {
      return next(
        new ErrorHandler("Invalid Product Id, No product found", 404)
      );
    }

    if (photo) {
      rm(product.photo, () => {
        console.log("Old Photo Deleted");
      });

      product.photo = photo.path;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    await product.save();
    await invalidateCache({ product: true, productId: String(product._id) });

    return res.status(200).json({
      success: true,
      message: `Product Updated Successfully`,
    });
  }
);

export const deleteProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("No product found", 404));
    }
    rm(product.photo, () => {
      console.log("Product Photo Deleted");
    });

    await product.deleteOne();

    await invalidateCache({ product: true, productId: String(product._id) });

    return res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  }
);

export const getAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, price, category, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCTS_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }

    if (category) {
      baseQuery.category = category;
    }

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredProducts] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPages = Math.ceil(filteredProducts.length / limit);

    return res.status(201).json({
      success: true,
      products,
      totalPages,
    });
  }
);



















// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(3);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };
// deleteRandomsProducts(37)

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\9ad5e911-701f-4069-8135-7a23a344cacb.jpg",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };
// generateRandomProducts(40)

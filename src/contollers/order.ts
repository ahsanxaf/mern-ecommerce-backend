import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { nodeCache } from "../app.js";

export const myOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;

    let myOrders = [];
    if (nodeCache.has(key)) {
      myOrders = JSON.parse(nodeCache.get(key) as string);
    } else {
      myOrders = await Order.find({ user });
      nodeCache.set(key, JSON.stringify(myOrders));
    }

    return res.status(200).json({
      success: true,
      myOrders,
    });
  }
);

export const allOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const key = `all-orders`;

    let allOrders = [];
    if (nodeCache.has(key)) {
      allOrders = JSON.parse(nodeCache.get(key) as string);
    } else {
      allOrders = await Order.find().populate("user", "name");
      nodeCache.set(key, JSON.stringify(allOrders));
    }

    return res.status(200).json({
      success: true,
      allOrders,
    });
  }
);

export const getSingleOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const key = `order-${id}`;

    let order;
    if (nodeCache.has(key)) {
      order = JSON.parse(nodeCache.get(key) as string);
    } else {
      order = await Order.findById(id).populate("user", "name");
      if (!order) {
        return next(new ErrorHandler("No Order found", 404));
      }
      nodeCache.set(key, JSON.stringify(order));
    }

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    if (
      !shippingInfo ||
      !user ||
      !subtotal ||
      !tax ||
      !shippingCharges ||
      !total
    ) {  
      return next(new ErrorHandler("Please Fill all the Fields", 400));
    }

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    await reduceStock(orderItems);
    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map(i=>String(i.productId))
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const processOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return next(new ErrorHandler("No Order found", 404));
    }

    switch (order.status) {
      case "Processing":
        order.status = "Shipped";
        break;

      case "Shipped":
        order.status = "Delivered";
        break;

      default:
        order.status = "Delivered";
        break;
    }

    await order.save();

    invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id)
    });

    return res.status(200).json({
      success: true,
      message: "Order Processed Successfully",
    });
  }
);

export const deleteOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new ErrorHandler("No Order found", 404));
    }

    await order.deleteOne();

    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id)
    });

    return res.status(200).json({
      success: true,
      message: "Order Deleted Successfully",
    });
  }
);

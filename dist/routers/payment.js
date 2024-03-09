import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { allCoupons, applyDiscount, createCoupon, createPaymentIntent, deleteCoupon, } from "../contollers/payment.js";
const app = express.Router();
// route - /api/v1/payment/{api-name}
app
    .post("/create", createPaymentIntent)
    .post("/coupon/new", isAdmin, createCoupon)
    .get("/discount", applyDiscount)
    .get("/coupon/all", isAdmin, allCoupons)
    .delete("/coupon/:id", isAdmin, deleteCoupon);
export default app;

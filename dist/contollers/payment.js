import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";
import { stripe } from "../app.js";
export const createPaymentIntent = TryCatch(async (req, res, next) => {
    const { amount } = req.body;
    if (!amount) {
        return next(new ErrorHandler("Please Enter Amount", 400));
    }
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount) * 100,
        currency: "usd",
    });
    return res.status(201).json({
        success: true,
        clientSecret: paymentIntent.client_secret
    });
});
export const createCoupon = TryCatch(async (req, res, next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount) {
        return next(new ErrorHandler("Please Enter both Coupon and Amount", 400));
    }
    await Coupon.create({ couponCode: coupon, amount });
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon} created successfully`,
    });
});
export const applyDiscount = TryCatch(async (req, res, next) => {
    const { coupon } = req.query;
    const discount = await Coupon.findOne({ couponCode: coupon });
    if (!discount) {
        return next(new ErrorHandler("Invalid Coupon Code", 404));
    }
    return res.status(200).json({
        success: true,
        discount: discount.amount,
    });
});
export const allCoupons = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find({});
    return res.status(200).json({
        success: true,
        coupons,
    });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
        return next(new ErrorHandler("Invalid Coupon Id", 400));
    }
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon?.couponCode} Deleted Successfully`,
    });
});

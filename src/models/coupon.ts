import mongoose, { Schema } from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    couponCode: { type: String, required: [true, 'Please Enter the Coupon Code'], unique: true },
    amount: { type: Number, required: [true, 'Please Enter the Discounted Amount'] },
  }
);

export const Coupon = mongoose.model("Coupon", couponSchema);

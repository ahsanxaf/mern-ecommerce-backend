import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRoute from "./routers/user.js";
import productRoute from "./routers/product.js";
import orderRoute from "./routers/order.js";
import paymentRoute from "./routers/payment.js";
import dashboardRoute from "./routers/stats.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from 'morgan';
import Stripe from "stripe";
import cors from 'cors'

const port = process.env.PORT || 8282;
config({path: './.env'});
const mongoURI = process.env.MONGO_URI || '';
const stripeKey = process.env.STRIPE_KEY || '';

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);

export const nodeCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use('/uploads', express.static('uploads'))
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});

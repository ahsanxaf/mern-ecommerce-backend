import { nodeCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getInventories } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};
    const key = "admin-stats";
    if (nodeCache.has(key)) {
        stats = JSON.parse(nodeCache.get(key));
    }
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const orderMonthCounts = new Array(6).fill(0);
        const orderMonthlyRevenue = new Array(6).fill(0);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const lastSixMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        });
        const latestTransactionPromise = Order.find({})
            .select(["orderItems", "discount", "total", "status"])
            .limit(4);
        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProducts, lastMonthUsers, lastMonthOrders, productsCount, usersCount, allOrders, lastSixMonthsOrders, categories, femaleUsersCount, latestTransaction,] = await Promise.all([
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthsOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestTransactionPromise,
        ]);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            user: usersCount,
            product: productsCount,
            order: allOrders.length,
        };
        const changePercent = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        lastSixMonthsOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = today.getMonth() - creationDate.getMonth();
            if (monthDiff < 6) {
                orderMonthCounts[6 - monthDiff - 1] += 1;
                orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
            }
        });
        const categoryCount = await getInventories({
            categories,
            productsCount,
        });
        const userRatio = {
            male: usersCount - femaleUsersCount,
            female: femaleUsersCount,
        };
        const modifiedLatestTransaction = latestTransaction.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status,
        }));
        stats = {
            changePercent,
            count,
            chart: { order: orderMonthCounts, revenue: orderMonthlyRevenue },
            categoryCount,
            userRatio,
            latestTransaction: modifiedLatestTransaction,
        };
        nodeCache.set(key, JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        stats,
    });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-pie-chart";
    if (nodeCache.has(key)) {
        charts = JSON.parse(nodeCache.get(key));
    }
    else {
        const allOrdersPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingCharges",
        ]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, productsCount, OutOfStock, allOrders, allUsers, adminUsers, customerUsers,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrdersPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
        ]);
        const orderFullfillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const productCategories = await getInventories({
            categories,
            productsCount,
        });
        const stockAvailability = {
            inStock: productsCount - OutOfStock,
            OutOfStock,
        };
        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const markeetingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - productionCost - burnt - markeetingCost - discount;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            markeetingCost,
        };
        const usersAgeGroup = {
            teen: allUsers.filter((i) => i.age < 20).length,
            adult: allUsers.filter((i) => i.age >= 20 && i.age <= 40).length,
            old: allUsers.filter((i) => i.age > 40).length,
        };
        const adminCustomer = {
            admin: adminUsers,
            customer: customerUsers,
        };
        charts = {
            orderFullfillment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer,
        };
        nodeCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
export const getBarCharts = TryCatch(async (req, res, next) => { });
export const getLineCharts = TryCatch(async (req, res, next) => { });
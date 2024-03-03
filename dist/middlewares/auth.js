import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";
// middleware to make sure only admin is allowed 
export const isAdmin = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    if (!id) {
        return next(new ErrorHandler('Please Login First', 401));
    }
    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler('Invalid User', 401));
    }
    if (user.role !== 'admin') {
        return next(new ErrorHandler('Only Admin can Access this field', 401));
    }
    next();
});

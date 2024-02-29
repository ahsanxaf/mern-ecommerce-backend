import express from 'express';
const port = 8080;
import userRoute from './routers/user.js';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
connectDB();
const app = express();
app.use(express.json());
app.use('/api/v1/user', userRoute);
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`Server Started on port ${port}`);
});

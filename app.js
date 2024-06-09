import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
dotenv.config();
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";

app.use(cors());

//cookies and filemiddleware
app.use(cookieParser());

// morgan middlewares
import morgan from "morgan";
app.use(morgan("tiny"));

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import all routes here
import productAdminRoutes from "./routes/productAdminRoutes.js";
import restaurantAdminRoutes from "./routes/restaurantAdminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";

// middlewares
import verifyUser from "./middlewares/authMiddleware.cjs";

// router middleware
app.use("/api/v1/common", verifyUser, commonRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/productAdmin", verifyUser, productAdminRoutes);
app.use("/api/v1/restaurantAdmin", verifyUser, restaurantAdminRoutes);

export default app;

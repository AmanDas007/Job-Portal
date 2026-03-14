import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./utils/passport.js";
import cookieParser from "cookie-parser";

import initDB from "./config/initDB.js";
import authRoutes from "./routes/auth.route.js";
import jobseekerRoutes from "./routes/jobseeker.route.js"

dotenv.config();

const app = express();

/* CORS */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

/* Middlewares */
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

/* Initialize database */
initDB();

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/user", jobseekerRoutes);

/* Server */
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
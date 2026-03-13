import express from "express";
import passport from "./utils/passport.js";
import cors from "cors";
import dotenv from "dotenv";

import initDB from "./config/initDB.js";
import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.route.js";

dotenv.config();

const app = express();
app.use(passport.initialize());

app.use(cors());
app.use(express.json());

// initialize database
initDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
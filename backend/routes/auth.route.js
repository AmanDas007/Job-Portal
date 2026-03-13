import express from "express";
import passport from "../utils/passport.js";

import { registerUser, loginUser, deleteAccount, authMe } from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, authMe);
router.delete("/delete", authMiddleware, deleteAccount);

router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account"
    })
);

export default router;

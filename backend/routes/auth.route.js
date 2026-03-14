import express from "express";
import passport from "../utils/passport.js";

import { registerUser, loginUser, deleteAccount, authMe } from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import { generateToken } from "../utils/token.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, authMe);
router.delete("/delete", authMiddleware, deleteAccount);

/* GOOGLE LOGIN */

router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"], // This tells Google what information your app wants.
      prompt: "select_account"
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "http://localhost:5173/login"
    }),
    (req, res) => {

        // passport.js automatically sets the object user.rows[0] on req.user by the line done(null, user.rows[0]);
        const token = generateToken(req.user.id, req.user.role);
  
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,        // only https
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    
        res.redirect("http://localhost:5173/home");
    }
);

/* GITHUB LOGIN */

router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] })
  );
  
  router.get(
    "/github/callback",
    passport.authenticate("github", {
      session: false,
      failureRedirect: "http://localhost:5173/login"
    }),
    (req, res) => {
  
        const token = generateToken(req.user.id, req.user.role);
    
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    
        res.redirect("http://localhost:5173/home");
    }
);

export default router;

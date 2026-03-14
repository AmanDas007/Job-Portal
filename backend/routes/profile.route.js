import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import {
  upsertProfile,
  updateProfileImage,
  deleteProfileImage
} from "../controllers/profile.controller.js";

const router = express.Router();

router.put(
  "/",
  authMiddleware,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  upsertProfile
);

router.put(
  "/image",
  authMiddleware,
  upload.single("image"),
  updateProfileImage
);

router.delete(
  "/image",
  authMiddleware,
  deleteProfileImage
);

export default router;
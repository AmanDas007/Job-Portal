import express from "express";

import {
    getAllJobs, getJobById, applyForJob
} from "../controllers/jobseeker/job.controller.js";

import {
    registerUser, upsertProfile, updateProfileImage, deleteProfileImage,
    getMyApplications, deleteAccount
} from "../controllers/jobseeker/me.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.delete("/me/delete", authMiddleware, deleteAccount);
router.put(
    "/profile",
    authMiddleware,
    upload.fields([
        { name: "resume", maxCount: 1 },
        { name: "image", maxCount: 1 }
    ]),
    upsertProfile
);

router.put(
    "/profile/image",
    authMiddleware,
    upload.single("image"),
    updateProfileImage
);

router.delete(
    "/profile/image",
    authMiddleware,
    deleteProfileImage
);

router.get("/jobs", authMiddleware, getAllJobs);
router.get("/jobs/:id", authMiddleware, getJobById);
router.post("/jobs/:id/apply", authMiddleware, applyForJob);
router.get("/me/applications", authMiddleware, getMyApplications);

export default router;
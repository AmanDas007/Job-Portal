import pool from "../config/db.js";

export const upsertProfile = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== "jobseeker") {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        const { phone, skills, experience } = req.body;

        const resumeUrl = req.files?.resume ? req.files.resume[0].path : null;
        const imageUrl = req.files?.image ? req.files.image[0].path : null;

        const user = await pool.query(
        `UPDATE users
        SET
            phone = COALESCE($1, phone),
            skills = COALESCE($2, skills),
            experience = COALESCE($3, experience),
            resume_url = COALESCE($4, resume_url),
            image_url = COALESCE($5, image_url)
        WHERE id = $6
        RETURNING id,name,email,phone,skills,experience,resume_url,image_url`,
        [phone, skills, experience, resumeUrl, imageUrl, req.user.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
        message: "Profile saved successfully",
        user: user.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateProfileImage = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== "jobseeker") {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }
        const imageUrl = req.file.path;

        const user = await pool.query(
        `UPDATE users
            SET image_url=$1
            WHERE id=$2
            RETURNING id,name,email,image_url`,
        [imageUrl, req.user.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
        message: "Profile image updated",
        user: user.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
import pool from "../../config/db.js";
import { JS, REC, AD } from "../../utils/role.js";
import cloudinary from "../../utils/cloudinary.js";

// REGISTER USER
export const registerUser = async (req, res) => {

    try {
      // for jobseeker only
      const { name, email, password } = req.body;
  
      const userExists = await pool.query(
        "SELECT * FROM users WHERE email=$1",
        [email]
      );
  
      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: "Account already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await pool.query(
        "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email,role",
        [name, email, hashedPassword]
      );
  
      const user = newUser.rows[0];
  
      const token = generateToken(user.id, user.role);
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
      });
  
      res.json({
        user: {
          id: newUser.rows[0].id,
          name: newUser.rows[0].name,
          email: newUser.rows[0].email,
          role: newUser.rows[0].role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  
};

export const upsertProfile = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== JS) {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        const { phone, skills, experience } = req.body;

        const resumeUrl = req.files?.resume?.[0]?.path || null;
        const imageUrl = req.files?.image?.[0]?.path || null;

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
        if (userRole !== JS) {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }
        const imageUrl = req.file?.path;

        // get current image
        const existingUser = await pool.query(
            "SELECT image_url FROM users WHERE id=$1",
            [req.user.id]
        );
    
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
    
        const oldImage = existingUser.rows[0].image_url;

        // delete old image from cloudinary
        if (oldImage) {
            const publicId = oldImage.split("/").slice(-2).join("/").split(".")[0];
    
            await cloudinary.uploader.destroy(publicId);
        }

        const user = await pool.query(
        `UPDATE users
            SET image_url=$1
            WHERE id=$2
            RETURNING id,role,name,email,image_url`,
        [imageUrl, req.user.id]
        );

        res.json({
        message: "Profile image updated",
        user: user.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteProfileImage = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== JS) {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        const user = await pool.query(
            "SELECT image_url FROM users WHERE id=$1",
            [req.user.id]
        );
    
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
    
        const imageUrl = user.rows[0].image_url;
    
        if (!imageUrl) {
            return res.status(400).json({ message: "No image to delete" });
        }
    
        const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
    
        await cloudinary.uploader.destroy(publicId);
    
        await pool.query(
            "UPDATE users SET image_url=NULL WHERE id=$1",
            [req.user.id]
        );
    
        res.json({ message: "Profile image deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET MY APPLICATIONS
export const getMyApplications = async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== JS) {
        return res.status(403).json({ message: "UNAUTHORIZED" });
      }
  
      const userId = req.user.id;
  
      const applications = await pool.query(
        `
        SELECT 
          a.id AS application_id,
          a.status,
          a.applied_at,
  
          j.id AS job_id,
          j.title,
          j.location,
          j.job_type,
          j.work_mode,
          j.salary_min,
          j.salary_max,
          j.application_deadline,
  
          r.company_name,
          r.company_logo,
          r.industry
  
        FROM applications a
  
        JOIN jobs j ON a.job_id = j.id
        JOIN recruiters r ON j.recruiter_id = r.id
  
        WHERE a.user_id = $1
  
        ORDER BY a.applied_at DESC
        `,
        [userId]
      );
  
      res.status(200).json({
        applications: applications.rows
      });
  
    } catch (error) {
      res.status(500).json({
        message: "Server error"
      });
    }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
    try {
      // for jobseeker only
      const userId = req.user.id;
      const userRole = req.user.role;
  
      if (userRole !== JS) {
        return res.status(403).json({ message: "UNAUTHORIZED" });
      }
  
      await pool.query(
        "DELETE FROM users WHERE id=$1",
        [userId]
      );
  
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
  
      res.json({
        message: "Account deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
};
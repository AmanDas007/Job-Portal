import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token.js";
import { JS, REC, AD } from "../utils/role.js";

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check jobseekers
    let result = await pool.query(
      "SELECT id,name,email,password,role FROM users WHERE email=$1",
      [email]
    );

    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {

      // check recruiters
      const recruiter = await pool.query(
        "SELECT id,name,email,password,role FROM recruiters WHERE email=$1",
        [email]
      );

      if (recruiter.rows.length === 0) {
        return res.status(400).json({
          message: "Email not exists"
        });
      }

      user = recruiter.rows[0];
    }

    // check password
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Wrong password"
      });
    }

    // generate token
    const token = generateToken(user.id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// AUTH ME
export const authMe = async (req, res) => {
    try {
      const userRole = req.user.role;
  
      if (userRole === JS) {
        const user = await pool.query(
          "SELECT id,role,name,email,phone,skills,experience,resume_url,image_url FROM users WHERE id=$1",
          [req.user.id]
        );
    
        if (user.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }
    
        return res.json(user.rows[0]);
      } else if (userRole === REC) {
        const recruiter = await pool.query(
          "SELECT id, role, name, email, company_name, company_website, company_logo, company_description, industry, phone, location FROM recruiters WHERE id=$1",
          [req.user.id]
        );
    
        if (recruiter.rows.length === 0) {
          return res.status(404).json({ message: "Recruiter not found" });
        }
    
        return res.json(recruiter.rows[0]);
      } 
      res.json(403).json({ message: "UNAUTHORIZED" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
};

// LOGOUT ACCOUNT
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });

    res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

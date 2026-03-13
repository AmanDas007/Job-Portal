import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token.js";
import { JS, REC } from "../utils/role.js";

// REGISTER USER
export const registerUser = async (req, res) => {

  try {
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

// LOGIN USER
export const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT id,name,email,role FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Email not exists" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = generateToken(user.rows[0].id, user.rows[0].role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
          "SELECT id,role,name,email FROM recruiters WHERE id=$1",
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

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  // for jobseeker only currently

  try {

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

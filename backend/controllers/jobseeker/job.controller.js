import pool from "../../config/db.js";
import { JS, REC, AD } from "../../utils/role.js";

export const getAllJobs = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== JS) {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }

        const jobs = await pool.query(`
            SELECT 
            j.title,
            j.description,
            j.location,
            j.job_type,
            j.work_mode,
            j.experience_required,
            j.skills_required,
            j.salary_min,
            j.salary_max,
            j.application_deadline,
    
            r.company_name,
            r.company_logo,
            r.industry,
            r.phone
    
            FROM jobs j
            JOIN recruiters r
            ON j.recruiter_id = r.id
    
            WHERE j.is_active = true
    
            ORDER BY j.created_at DESC
        `);
    
        res.status(200).json({
            jobs: jobs.rows
        });  
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getJobById = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== JS) {
            return res.status(403).json({ message: "UNAUTHORIZED" });
        }
        
        const { id } = req.params;
    
        const job = await pool.query(
            `
            SELECT 
            j.id,
            j.title,
            j.description,
            j.location,
            j.job_type,
            j.work_mode,
            j.experience_required,
            j.skills_required,
            j.salary_min,
            j.salary_max,
            j.application_deadline,
            j.is_active,
            j.created_at,
    
            r.company_name,
            r.company_logo,
            r.industry,
            r.phone
    
            FROM jobs j
            JOIN recruiters r
            ON j.recruiter_id = r.id
    
            WHERE j.id = $1 AND j.is_active = true
            `,
            [id]
        );
    
        if (job.rows.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }
    
        res.status(200).json({
            job: job.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const applyForJob = async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== JS) {
        return res.status(403).json({ message: "UNAUTHORIZED" });
      }

      const userId = req.user.id;
      const { id } = req.params;

      const job = await pool.query(
        `SELECT id, is_active FROM jobs WHERE id = $1`,
        [id]
      );
  
      if (job.rows.length === 0) {
        return res.status(404).json({
          message: "Job not found"
        });
      }
  
      if (!job.rows[0].is_active) {
        return res.status(400).json({
          message: "Job is no longer active"
        });
      }

      if (new Date() > job.rows[0].application_deadline) {
        return res.status(400).json({
          message: "Application deadline passed"
        });
      }
  
      // insert application
      const application = await pool.query(
        `
        INSERT INTO applications (job_id, user_id)
        VALUES ($1, $2)
        RETURNING id, job_id, user_id, status, applied_at
        `,
        [id, userId]
      );
  
      res.status(201).json({
        message: "Application submitted successfully",
        application: application.rows[0]
      });
    } catch (error) {
  
      // duplicate application
      if (error.code === "23505") { // 23505 is a PostgreSQL error code
        return res.status(400).json({
          message: "You already applied to this job"
        });
      }
  
      res.status(500).json({
        message: "Server error"
      });
    }
};
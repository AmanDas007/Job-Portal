import pool from "./db.js";

const initDB = async () => {

  // await pool.query(`
  //   CREATE TYPE IF NOT EXISTS user_role AS ENUM (
  //     'jobseeker',
  //     'recruiter',
  //     'admin'
  //   );
  // `);

  await pool.query(`
    DO $$ 
    BEGIN
      CREATE TYPE user_role AS ENUM (
        'jobseeker',
        'recruiter',
        'admin'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  role user_role DEFAULT 'jobseeker',
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password TEXT,
  phone VARCHAR(20),
  skills TEXT,
  experience INTEGER,
  resume_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS recruiters(
  id SERIAL PRIMARY KEY,
  role user_role DEFAULT 'recruiter',
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,

      recruiter_id INTEGER NOT NULL,

      role VARCHAR(150) NOT NULL,
      title VARCHAR(200),
      description TEXT,

      company_name VARCHAR(150),
      location VARCHAR(150),

      job_type VARCHAR(50),
      work_mode VARCHAR(50),

      experience_required INTEGER,
      skills_required TEXT,

      salary_min INTEGER,
      salary_max INTEGER,

      openings INTEGER DEFAULT 1,

      application_deadline DATE,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (recruiter_id) 
      REFERENCES recruiters(id) 
      ON DELETE CASCADE
  );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS applications(
  id SERIAL PRIMARY KEY,
  job_id INTEGER,
  user_id INTEGER,
  applicant_name VARCHAR(100),
  applicant_email VARCHAR(150),
  applicant_phone VARCHAR(20),
  resume_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  application_status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `);

  console.log("Tables created");

};

export default initDB;
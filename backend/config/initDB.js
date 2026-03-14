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
    DO $$
    BEGIN
      CREATE TYPE job_type_enum AS ENUM (
        'full-time',
        'part-time',
        'internship',
        'contract'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE work_mode_enum AS ENUM (
        'remote',
        'onsite',
        'hybrid'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE application_status_enum AS ENUM (
        'applied',
        'under_review',
        'shortlisted',
        'accepted',
        'rejected'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  role user_role DEFAULT 'jobseeker',
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
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
    
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password TEXT NOT NULL,
    
      company_name VARCHAR(150) NOT NULL,
      company_logo TEXT,
      industry VARCHAR(100),
    
      phone VARCHAR(20),
    
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // for jobs: take company_name, company_logo, industry, phone from recruiters table

  await pool.query(`
  CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,

      recruiter_id INTEGER NOT NULL,

      title VARCHAR(200) NOT NULL,
      description TEXT,
      location VARCHAR(150),

      job_type job_type_enum NOT NULL,
      work_mode work_mode_enum NOT NULL,

      experience_required INTEGER,
      skills_required TEXT,

      salary_min INTEGER,
      salary_max INTEGER,

      application_deadline DATE,

      is_active BOOLEAN DEFAULT true,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (recruiter_id) 
      REFERENCES recruiters(id) 
      ON DELETE CASCADE
  );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS applications(
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  status application_status_enum DEFAULT 'applied',

  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_application UNIQUE(job_id, user_id),

  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `);

  console.log("Tables created");

};

export default initDB;
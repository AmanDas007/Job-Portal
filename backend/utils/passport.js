import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import pool from "../config/db.js";

/* GOOGLE LOGIN */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const image = profile.photos?.[0]?.value;

        // check users table
        let user = await pool.query(
          "SELECT id,name,email,image_url,role FROM users WHERE email=$1",
          [email]
        );

        // if not found check recruiters
        if (user.rows.length === 0) {
          const recruiter = await pool.query(
            "SELECT id,name,email,company_logo AS image_url,role FROM recruiters WHERE email=$1",
            [email]
          );

          if (recruiter.rows.length > 0) {
            return done(null, recruiter.rows[0]);
          }
        }

        // create new user if not found anywhere
        if (user.rows.length === 0) {

          const newUser = await pool.query(
            `INSERT INTO users(name,email,password,image_url)
             VALUES($1,$2,$3,$4)
             RETURNING id,name,email,image_url,role`,
            [name, email, "oauth", image]
          );

          user = newUser;

        } else {

          if (!user.rows[0].image_url && image) {
            await pool.query(
              "UPDATE users SET image_url=$1 WHERE email=$2",
              [image, email]
            );
          }

        }

        done(null, user.rows[0]);

      } catch (err) {
        done(err, null);
      }
    }
  )
);


/* GITHUB LOGIN */

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    },
    async (accessToken, refreshToken, profile, done) => {

      try {

        const email =
          profile.emails?.[0]?.value ||
          `${profile.username}@github.com`;

        const name = profile.displayName || profile.username;
        const image = profile.photos?.[0]?.value;

        // check users table
        let user = await pool.query(
          "SELECT id,name,email,image_url,role FROM users WHERE email=$1",
          [email]
        );

        // check recruiters table
        if (user.rows.length === 0) {

          const recruiter = await pool.query(
            "SELECT id,name,email,company_logo AS image_url,role FROM recruiters WHERE email=$1",
            [email]
          );

          if (recruiter.rows.length > 0) {
            return done(null, recruiter.rows[0]);
          }
        }

        // create new user if not found
        if (user.rows.length === 0) {

          const newUser = await pool.query(
            `INSERT INTO users(name,email,password,image_url)
             VALUES($1,$2,$3,$4)
             RETURNING id,name,email,image_url,role`,
            [name, email, "oauth", image]
          );

          user = newUser;

        } else {

          if (!user.rows[0].image_url && image) {
            await pool.query(
              "UPDATE users SET image_url=$1 WHERE email=$2",
              [image, email]
            );
          }

        }

        done(null, user.rows[0]);

      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;
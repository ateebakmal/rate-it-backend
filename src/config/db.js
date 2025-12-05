import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "db.uehznjfjhpuzxridpgtq.supabase.co",
  database: "postgres",
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

export default pool;

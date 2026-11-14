import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // cloud databases need a secure connection
  max: 5, // the free pooler allows only a few connections
});

pool.on("error", (err) => console.error("Database error:", err.message));

export default pool;
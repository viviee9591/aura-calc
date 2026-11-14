import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import historyRoutes from "./routes/history.js";
import askRoutes from "./routes/ask.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// websites allowed to call this backend (CLIENT_URL can hold several, separated by commas)
const allowed = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowed.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS")),
  })
);
app.use(express.json());

app.use("/api/history", historyRoutes);
app.use("/api/ask", askRoutes);

app.get("/", (req, res) => {
  res.send("Aurelia API is running");
});

async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in the .env file");
    }

    await pool.query("SELECT 1");
    console.log("Database connected");

    // creates the table on a brand new database (does nothing if it exists)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        expression VARCHAR(255) NOT NULL,
        result VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

start();
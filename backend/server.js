import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import historyRoutes from "./routes/history.js";
import askRoutes from "./routes/ask.js";   // NEW line 1

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/history", historyRoutes);
app.use("/api/ask", askRoutes);            // NEW line 2


// Simple check route
app.get("/", (req, res) => {
  res.send("AURA CALC API is running");
});

// Start server after checking the database
async function start() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
    process.exit(1);
  }
}

start();
import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/history -> get all (newest first)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, expression, result, created_at FROM history ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch history" });
  }
});

// POST /api/history -> save one calculation
router.post("/", async (req, res) => {
  try {
    const { expression, result } = req.body;

    if (!expression || result === undefined || result === null) {
      return res.status(400).json({ error: "expression and result are required" });
    }

    const { rows } = await pool.query(
      "INSERT INTO history (expression, result) VALUES ($1, $2) RETURNING id, expression, result, created_at",
      [String(expression).slice(0, 255), String(result).slice(0, 100)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not save calculation" });
  }
});

// DELETE /api/history/:id -> delete one
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { rowCount } = await pool.query("DELETE FROM history WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Deleted", id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not delete item" });
  }
});

// DELETE /api/history -> delete all
router.delete("/", async (req, res) => {
  try {
    await pool.query("DELETE FROM history");
    res.json({ message: "All history cleared" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not clear history" });
  }
});

export default router;
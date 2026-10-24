import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/history -> get all (newest first)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, expression, result, created_at FROM history ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
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

    const [info] = await pool.query(
      "INSERT INTO history (expression, result) VALUES (?, ?)",
      [String(expression), String(result)]
    );

    const [rows] = await pool.query("SELECT * FROM history WHERE id = ?", [
      info.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save calculation" });
  }
});

// DELETE /api/history/:id -> delete one
router.delete("/:id", async (req, res) => {
  try {
    const [info] = await pool.query("DELETE FROM history WHERE id = ?", [
      req.params.id,
    ]);

    if (info.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Deleted", id: Number(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete item" });
  }
});

// DELETE /api/history -> delete all
router.delete("/", async (req, res) => {
  try {
    await pool.query("DELETE FROM history");
    res.json({ message: "All history cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not clear history" });
  }
});

export default router;
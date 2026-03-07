const express = require("express");
const { pool } = require("../db");
const authenticate = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// List all projects for the logged-in user (no canvas data — just metadata)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at,
              jsonb_array_length(data->'blocks') AS block_count
       FROM projects
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List projects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single project with full canvas data
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, data, created_at, updated_at FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new project
// Body: { name: string, data?: { blocks: [...], connections: [...] } }
router.post("/", async (req, res) => {
  const { name, data } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const canvasData = {
    blocks: data?.blocks ?? [],
    connections: data?.connections ?? [],
  };

  try {
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, data)
       VALUES ($1, $2, $3)
       RETURNING id, name, data, created_at, updated_at`,
      [req.userId, name.trim(), JSON.stringify(canvasData)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Save (full overwrite) of canvas state
// Body: { name?: string, data?: { blocks: [...], connections: [...] } }
router.put("/:id", async (req, res) => {
  const { name, data } = req.body;

  // If data is provided, ensure it has the expected shape
  let canvasJson = null;
  if (data !== undefined) {
    canvasJson = JSON.stringify({
      blocks: data.blocks ?? [],
      connections: data.connections ?? [],
    });
  }

  try {
    const result = await pool.query(
      `UPDATE projects SET
         name       = COALESCE($1, name),
         data       = COALESCE($2::jsonb, data),
         updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, data, created_at, updated_at`,
      [name?.trim() || null, canvasJson, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
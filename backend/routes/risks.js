import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/risks?project_id=? to list all risks of a project
router.get("/", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const risks = db
    .prepare("SELECT * FROM risks WHERE project_id = ?")
    .all(project_id);
  res.json(risks);
});

// GET /api/risks/:risk_id to return a specific risk
router.get("/:risk_id", (req, res) => {
  const risk = db
    .prepare("SELECT * FROM risks WHERE risk_id = ?")
    .get(req.params.risk_id);
  if (risk == undefined) {
    return res.status(404).json({ error: "Risk not found." });
  }
  res.json(risk);
});

// POST /api/risks to create a risk
router.post("/", (req, res) => {
  try {
    let { name, project_id, description, priority, probability, impact } =
      req.body;
    if (name == undefined || name.trim() === "") {
      return res.status(400).json({ error: "Enter a valid risk name." });
    }
    if (project_id == undefined) {
      return res.status(400).json({ error: "Enter a valid project ID." });
    }
    if (
      priority != undefined &&
      priority != "low" &&
      priority != "medium" &&
      priority != "high"
    ) {
      return res.status(400).json({
        error: "Enter a valid priority (null, low, medium, high).",
      });
    }
    if (
      Number(probability) < 1 ||
      Number(probability) > 5 ||
      !Number.isInteger(Number(probability))
    ) {
      return res
        .status(400)
        .json({ error: "Enter a valid probability (1, 2, 3, 4, or 5)" });
    }
    if (
      Number(impact) < 1 ||
      Number(impact) > 5 ||
      !Number.isInteger(Number(impact))
    ) {
      return res
        .status(400)
        .json({ error: "Enter a valid impact (1, 2, 3, 4, or 5)" });
    }
    const result = db
      .prepare(
        "INSERT INTO risks (name, project_id, description, priority, probability, impact, status) VALUES (?,?,?,?,?,?,'open')",
      )
      .run(name, project_id, description, priority, probability, impact);
    res.status(201).json({
      risk_id: result.lastInsertRowid,
      name,
      project_id,
      description,
      priority,
      probability,
      impact,
      status: "open",
    });
  } catch (e) {
    if (e.code == "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({ error: "Project not found." });
    }
    return res.status(500).json({ error: "Error creating risk." });
  }
});

// PUT /api/risks/:risk_id to edit a risk
router.put("/:risk_id", (req, res) => {
  const { name, description, priority, probability, impact, status } = req.body;
  if (name == undefined || name.trim() === "") {
    return res.status(400).json({ error: "Enter a valid risk name." });
  }
  if (
    priority != undefined &&
    priority != "low" &&
    priority != "medium" &&
    priority != "high"
  ) {
    return res.status(400).json({
      error: "Enter a valid priority (null, low, medium, high).",
    });
  }
  if (
    Number(probability) < 1 ||
    Number(probability) > 5 ||
    !Number.isInteger(Number(probability))
  ) {
    return res
      .status(400)
      .json({ error: "Enter a valid probability (1, 2, 3, 4, or 5)" });
  }
  if (
    Number(impact) < 1 ||
    Number(impact) > 5 ||
    !Number.isInteger(Number(impact))
  ) {
    return res
      .status(400)
      .json({ error: "Enter a valid impact (1, 2, 3, 4, or 5)" });
  }
  if (status != "open" && status != "mitigating" && status != "closed") {
    return res
      .status(400)
      .json({ error: "Enter a valid status: open, mitigating, or closed." });
  }
  const result = db
    .prepare(
      "UPDATE risks SET name = ?, description = ?, priority = ?, probability = ?, impact = ?, status = ? WHERE risk_id = ?",
    )
    .run(
      name,
      description,
      priority,
      probability,
      impact,
      status,
      req.params.risk_id,
    );
  if (result.changes == 0) {
    return res.status(404).json({ error: "Risk not found." });
  }
  res.json({
    risk_id: Number(req.params.risk_id),
    name,
    description,
    priority,
    probability,
    impact,
    status,
  });
});

// DELETE /api/risks/:risk_id to delete a risk
router.delete("/:risk_id", (req, res) => {
  const risk = db
    .prepare("DELETE FROM risks WHERE risk_id = ?")
    .run(req.params.risk_id);

  if (risk.changes == 0) {
    return res.status(404).json({ error: "Risk not found." });
  }
  res.json({ message: "Risk deleted." });
});

export default router;

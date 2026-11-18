import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/requirements?project_id=? to list all requirements of a project
router.get("/", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const requirements = db
    .prepare("SELECT * FROM requirements WHERE project_id = ?")
    .all(project_id);
  res.json(requirements);
});

// GET /api/requirements/:requirement_id to return a specific requirement
router.get("/:requirement_id", (req, res) => {
  const requirement = db
    .prepare("SELECT * FROM requirements WHERE requirement_id = ?")
    .get(req.params.requirement_id);
  if (requirement == undefined) {
    return res.status(404).json({ error: "Requirement not found." });
  }
  res.json(requirement);
});

// POST /api/requirements to create a requirement
router.post("/", (req, res) => {
  try {
    const { project_id, name, description, type, estimate } = req.body;
    if (project_id == undefined) {
      return res.status(400).json({ error: "Enter a valid project ID." });
    }
    if (name == undefined || name.trim() === "") {
      return res.status(400).json({ error: "Enter a valid requirement name." });
    }
    if (type != "functional" && type != "non-functional") {
      return res
        .status(400)
        .json({ error: "Enter a type: functional or non-functional" });
    }
    if (
      (Number(estimate) < 0 || isNaN(Number(estimate))) &&
      estimate != undefined
    ) {
      return res
        .status(400)
        .json({ error: "Enter a number (0 or greater) for estimate." });
    }
    const result = db
      .prepare(
        "INSERT INTO requirements (project_id, name, description, type, estimate) VALUES (?,?,?,?,?)",
      )
      .run(project_id, name, description, type, estimate);
    res.status(201).json({
      requirement_id: result.lastInsertRowid,
      project_id,
      name,
      description,
      type,
      estimate,
    });
  } catch (e) {
    if (e.code == "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({ error: "Project not found." });
    }
    return res.status(500).json({ error: "Error creating requirement." });
  }
});

export default router;

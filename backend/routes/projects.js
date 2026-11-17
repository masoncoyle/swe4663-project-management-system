import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/projects to list all projects
router.get("/", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects").all();
  res.json(projects);
});

// GET /api/projects/:project_id to list a specific project
router.get("/:project_id", (req, res) => {
  const project = db
    .prepare("SELECT * FROM projects WHERE project_id = ?")
    .get(req.params.project_id);
  if (project == undefined) {
    return res.status(404).json({ error: "Project not found." });
  }
  res.json(project);
});

// POST /api/projects to create a project
router.post("/", (req, res) => {
  const { name, description, owner_name } = req.body;
  if (name == undefined || name.trim() === "") {
    return res.status(400).json({ error: "Enter a valid project name." });
  }
  const result = db
    .prepare(
      "INSERT INTO projects (name, description, owner_name) VALUES (?,?,?)",
    )
    .run(name, description, owner_name);
  res.status(201).json({
    project_id: result.lastInsertRowid,
    name,
    description,
    owner_name,
  });
});

// PUT /api/projects/:project_id to edit a project
router.put("/:project_id", (req, res) => {
  const { name, description, owner_name } = req.body;
  if (name == undefined || name.trim() === "") {
    return res.status(400).json({ error: "Enter a valid project name." });
  }
  const result = db
    .prepare(
      "UPDATE projects SET name = ?, description = ?, owner_name = ? WHERE project_id = ?",
    )
    .run(name, description, owner_name, req.params.project_id);
  if (result.changes == 0) {
    return res.status(404).json({ error: "Project not found." });
  }
  res.json({
    project_id: Number(req.params.project_id),
    name,
    description,
    owner_name,
  });
});

export default router;

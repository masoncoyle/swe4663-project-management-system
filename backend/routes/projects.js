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
  const output = db
    .prepare(
      "INSERT INTO projects (name, description, owner_name) VALUES (?,?,?)",
    )
    .run(name, description, owner_name);
  res.status(201).json({
    project_id: output.lastInsertRowid,
    name,
    description,
    owner_name,
  });
});

export default router;

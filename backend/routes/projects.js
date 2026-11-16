import express from "express";
import db from "../utils/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects").all();
  res.json(projects);
});

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

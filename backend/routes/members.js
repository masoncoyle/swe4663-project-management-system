import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/members?project_id=? to list all members of a project
router.get("/", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const members = db
    .prepare("SELECT * FROM members WHERE project_id = ?")
    .all(project_id);
  res.json(members);
});

// GET /api/members/:member_id to return a specific member
router.get("/:member_id", (req, res) => {
  const member = db
    .prepare("SELECT * FROM members WHERE member_id = ?")
    .get(req.params.member_id);
  if (member == undefined) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.json(member);
});

// POST /api/members to create a member
router.post("/", (req, res) => {
  try {
    let { project_id, name, active_status } = req.body;
    if (project_id == undefined) {
      return res.status(400).json({ error: "Enter a valid project ID." });
    }
    if (name == undefined || name.trim() === "") {
      return res.status(400).json({ error: "Enter a valid member name." });
    }
    if (active_status == undefined) {
      active_status = "active";
    }
    if (active_status != "active" && active_status != "inactive") {
      return res.status(400).json({ error: "Enter a valid active status." });
    }
    const result = db
      .prepare(
        "INSERT INTO members (project_id, name, active_status) VALUES (?,?,?)",
      )
      .run(project_id, name, active_status);
    res.status(201).json({
      member_id: result.lastInsertRowid,
      project_id,
      name,
      active_status,
    });
  } catch (e) {
    if (e.code == "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({ error: "Project not found." });
    }
    return res.status(500).json({ error: "Error creating member." });
  }
});

// PUT /api/members/:member_id to edit a member
router.put("/:member_id", (req, res) => {
  const { name, active_status } = req.body;
  if (name == undefined || name.trim() === "") {
    return res.status(400).json({ error: "Enter a valid member name." });
  }
  if (active_status != "active" && active_status != "inactive") {
    return res.status(400).json({ error: "Enter a valid active status." });
  }
  const result = db
    .prepare(
      "UPDATE members SET name = ?, active_status = ? WHERE member_id = ?",
    )
    .run(name, active_status, req.params.member_id);
  if (result.changes == 0) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.json({
    member_id: Number(req.params.member_id),
    name,
    active_status,
  });
});

export default router;

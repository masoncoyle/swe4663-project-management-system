import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/effort?requirement_id=? to list all effort entries of a requirement
router.get("/", (req, res) => {
  const requirement_id = req.query.requirement_id;
  if (requirement_id == undefined) {
    return res.status(400).json({ error: "Requirement ID required" });
  }
  const entries = db
    .prepare("SELECT * FROM effort WHERE requirement_id = ?")
    .all(requirement_id);
  res.json(entries);
});

// GET /api/effort/:effort_id to return a specific effort entry
router.get("/:effort_id", (req, res) => {
  const entry = db
    .prepare("SELECT * FROM effort WHERE effort_id = ?")
    .get(req.params.effort_id);
  if (entry == undefined) {
    return res.status(404).json({ error: "Effort entry not found." });
  }
  res.json(entry);
});

// POST /api/effort to create an effort entry
router.post("/", (req, res) => {
  try {
    const { requirement_id, member_id, phase, hours, date } = req.body;
    if (requirement_id == undefined) {
      return res.status(400).json({ error: "Enter a valid requirement ID." });
    }
    if (member_id == undefined) {
      return res.status(400).json({ error: "Enter a valid member ID." });
    }

    if (
      phase != "Requirements Analysis" &&
      phase != "Design" &&
      phase != "Coding" &&
      phase != "Testing" &&
      phase != "Project Management"
    ) {
      return res.status(400).json({
        error:
          "Enter a valid phase: Requirements Analysis, Design, Coding, Testing, Project Management",
      });
    }
    if (Number(hours) <= 0 || isNaN(Number(hours))) {
      return res.status(400).json({
        error: "Enter a positive number (decimals allowed) for hours.",
      });
    }

    if (date == undefined) {
      return res.status(400).json({ error: "Enter a date (YYYY-MM-DD)." });
    }

    const result = db
      .prepare(
        "INSERT INTO effort (requirement_id, member_id, phase, hours, date) VALUES (?,?,?,?,?)",
      )
      .run(requirement_id, member_id, phase, hours, date);
    res.status(201).json({
      effort_id: result.lastInsertRowid,
      requirement_id,
      member_id,
      phase,
      hours,
      date,
    });
  } catch (e) {
    console.log(e.message);
    if (e.code == "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res
        .status(400)
        .json({ error: "Requirement or member ID not found." });
    }
    return res.status(500).json({ error: "Error creating effort entry." });
  }
});

// PUT /api/effort/:effort_id to edit an effort entry
router.put("/:effort_id", (req, res) => {
  const { phase, hours, date } = req.body;
  if (
    phase != "Requirements Analysis" &&
    phase != "Design" &&
    phase != "Coding" &&
    phase != "Testing" &&
    phase != "Project Management"
  ) {
    return res.status(400).json({
      error:
        "Enter a valid phase: Requirements Analysis, Design, Coding, Testing, Project Management",
    });
  }
  if (Number(hours) <= 0 || isNaN(Number(hours))) {
    return res.status(400).json({
      error: "Enter a positive number (decimals allowed) for hours.",
    });
  }
  if (date == undefined) {
    return res.status(400).json({ error: "Enter a date (YYYY-MM-DD)." });
  }
  const result = db
    .prepare(
      "UPDATE effort SET phase = ?, hours = ?, date = ? WHERE effort_id = ?",
    )
    .run(phase, hours, date, req.params.effort_id);
  if (result.changes == 0) {
    return res.status(404).json({ error: "Effort entry not found." });
  }
  res.json({
    effort_id: Number(req.params.effort_id),
    phase,
    hours,
    date,
  });
});

// DELETE /api/effort/:effort_id to delete an effort entry
router.delete("/:effort_id", (req, res) => {
  const entry = db
    .prepare("DELETE FROM effort WHERE effort_id = ?")
    .run(req.params.effort_id);

  if (entry.changes == 0) {
    return res.status(404).json({ error: "Effort entry not found." });
  }
  res.json({ message: "Effort entry deleted." });
});

export default router;

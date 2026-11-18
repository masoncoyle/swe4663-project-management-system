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

export default router;

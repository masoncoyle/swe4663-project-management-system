import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// GET /api/reports/hours-by-requirement?project_id=? to get total hours per requirement and phase
router.get("/hours-by-requirement", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const report = db
    .prepare(
      "SELECT requirements.requirement_id, requirements.name, effort.phase, COALESCE(SUM(effort.hours), 0) AS total_hours FROM requirements LEFT JOIN effort ON requirements.requirement_id = effort.requirement_id WHERE requirements.project_id = ? GROUP BY requirements.requirement_id, effort.phase",
    )
    .all(project_id);
  res.json(report);
});

// GET /api/reports/hours-by-phase?project_id=? to get total hours per development phase
router.get("/hours-by-phase", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const report = db
    .prepare(
      "SELECT effort.phase, SUM(effort.hours) AS total_hours FROM effort JOIN requirements ON requirements.requirement_id = effort.requirement_id WHERE requirements.project_id = ? GROUP BY effort.phase",
    )
    .all(project_id);
  res.json(report);
});

// GET /api/reports/hours-by-member?project_id=? to get total hours per team member
router.get("/hours-by-member", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const report = db
    .prepare(
      "SELECT members.member_id, members.name, members.active_status, COALESCE(SUM(effort.hours), 0) AS total_hours FROM members LEFT JOIN effort ON members.member_id = effort.member_id WHERE members.project_id = ? GROUP BY members.member_id",
    )
    .all(project_id);
  res.json(report);
});

// GET /api/reports/risks-ranked?project_id=? to list all risks ranked by exposure (probability * impact)
router.get("/risks-ranked", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const risks = db
    .prepare(
      "SELECT *, probability * impact AS exposure FROM risks WHERE project_id = ? ORDER BY exposure DESC, impact DESC",
    )
    .all(project_id);
  res.json(risks);
});

// GET /api/reports/estimate-vs-actual?project_id=? to get the estimated vs actual
// effort hours for each requirement in a project (exceeds_estimate: 1 = actual exceeds
// estimate, 0 = actual does not exceed estimate or does not have an estimate)
router.get("/estimate-vs-actual", (req, res) => {
  const project_id = req.query.project_id;
  if (project_id == undefined) {
    return res.status(400).json({ error: "Project ID required" });
  }
  const report = db
    .prepare(
      "SELECT requirements.requirement_id, requirements.name, requirements.estimate, COALESCE(SUM(effort.hours), 0) AS actual_hours, CASE WHEN (COALESCE(SUM(effort.hours), 0) > requirements.estimate) THEN 1 ELSE 0 END AS exceeds_estimate FROM requirements LEFT JOIN effort ON requirements.requirement_id = effort.requirement_id WHERE requirements.project_id = ? GROUP BY requirements.requirement_id",
    )
    .all(project_id);
  res.json(report);
});

export default router;

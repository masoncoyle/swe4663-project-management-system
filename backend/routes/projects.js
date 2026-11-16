import express from "express";
import db from "../utils/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects").all();
  res.json(projects);
});

export default router;

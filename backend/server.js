import express from "express";
import cors from "cors";
import "./utils/db.js";
import projectsRouter from "./routes/projects.js";
import membersRouter from "./routes/members.js";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/projects", projectsRouter);
app.use("/api/members", membersRouter);

app.get("/api/health", (req, res) => {
  res.send("Server running");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

import Database from "better-sqlite3";
const db = new Database("projects.db");
db.exec(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT
)`);
export default db;

import Database from "better-sqlite3";

const db = new Database("projects.db");
db.exec(`CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_name TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    active_status TEXT NOT NULL CHECK(active_status IN ('active', 'inactive')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)`);

db.exec(`CREATE TABLE IF NOT EXISTS requirements (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('functional', 'non-functional')),
    estimate REAL CHECK(estimate >= 0),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)`);

db.exec(`CREATE TABLE IF NOT EXISTS risks (
    risk_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    probability INTEGER CHECK(probability BETWEEN 1 AND 5),
    impact INTEGER CHECK(impact BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK(status IN ('open', 'mitigating', 'closed')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)`);

db.exec(`CREATE TABLE IF NOT EXISTS effort (
    effort_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    phase TEXT NOT NULL CHECK(phase IN ('Requirements Analysis', 'Design', 'Coding', 'Testing', 'Project Management')),
    hours REAL NOT NULL CHECK(hours >= 0),
    date TEXT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE

)`);

export default db;

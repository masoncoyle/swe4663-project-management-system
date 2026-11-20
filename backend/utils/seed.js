// Loads synthetic development data into projects.db.
//
// Run from the backend folder:
//   npm run seed               only if the database has no projects yet
//   npm run seed -- --reset    delete ALL existing data first, then seed (IDs restart at 1)
//   npm run seed -- --append   add the seed data alongside whatever is already there
//
// Writes straight to the database through db.js, so the server does not need to be
// running. The data is fixed (not random), so totals can be checked by hand.
import db from "./db.js";

// Each effort row: [requirement key, member name, phase, hours, date]
const seedProjects = [
  {
    name: "Campus Event Planner",
    description: "Web app for student organizations to create events and track RSVPs.",
    owner_name: "Dana Reyes",
    members: [
      { name: "Ann Lee", active_status: "active" },
      { name: "Marcus Hill", active_status: "active" },
      { name: "Priya Shah", active_status: "active" },
      // Inactive but has logged effort, to show attribution is kept (FR02)
      { name: "Tom Becker", active_status: "inactive" },
    ],
    requirements: {
      register: { name: "User registration", type: "functional", estimate: 12, description: "Students create an account with their school email." },
      events: { name: "Event creation", type: "functional", estimate: 16, description: "Organizers create, edit, and cancel events." },
      rsvp: { name: "RSVP tracking", type: "functional", estimate: 10, description: "Students RSVP and organizers see attendee counts." },
      calendar: { name: "Calendar export", type: "functional", estimate: null, description: "Export an event to a calendar file." },
      speed: { name: "Pages load under 2 seconds", type: "non-functional", estimate: 6, description: "Main pages load in under 2 seconds on campus Wi-Fi." },
      backup: { name: "Nightly data backup", type: "non-functional", estimate: 4, description: "Database is backed up every night." },
    },
    risks: [
      { name: "Scope creep", description: "Organizers keep requesting new event features.", priority: "high", probability: 4, impact: 4, status: "open" },
      { name: "Email service limits", description: "Free email tier may cap registration emails.", priority: "medium", probability: 3, impact: 3, status: "mitigating" },
      { name: "Team member leaves", description: "A member drops the course mid-project.", priority: "high", probability: 2, impact: 5, status: "mitigating" },
      { name: "Hosting cost", description: "Campus hosting may require a paid plan.", priority: "low", probability: 1, impact: 2, status: "closed" },
    ],
    effort: [
      ["register", "Ann Lee", "Requirements Analysis", 2, "2026-10-05"],
      ["register", "Ann Lee", "Design", 3, "2026-10-12"],
      ["register", "Marcus Hill", "Coding", 4.5, "2026-10-20"],
      ["register", "Priya Shah", "Testing", 1.5, "2026-10-28"],
      ["events", "Tom Becker", "Requirements Analysis", 2.5, "2026-10-06"],
      ["events", "Tom Becker", "Design", 3, "2026-10-13"],
      ["events", "Marcus Hill", "Coding", 6, "2026-10-21"],
      ["events", "Marcus Hill", "Coding", 4, "2026-10-27"],
      ["events", "Priya Shah", "Testing", 3, "2026-11-03"], // with the PM row below, events totals 20.5 > estimate 16 (FR10 flag)
      ["rsvp", "Priya Shah", "Requirements Analysis", 1, "2026-10-07"],
      ["rsvp", "Ann Lee", "Design", 2, "2026-10-14"],
      ["rsvp", "Ann Lee", "Coding", 3.5, "2026-11-04"],
      ["calendar", "Marcus Hill", "Design", 1, "2026-11-10"],
      ["speed", "Priya Shah", "Testing", 2, "2026-11-11"],
      ["backup", "Ann Lee", "Coding", 1.5, "2026-11-12"],
      ["events", "Ann Lee", "Project Management", 2, "2026-10-09"],
      ["rsvp", "Ann Lee", "Project Management", 1.5, "2026-11-06"],
    ],
  },
  {
    name: "Inventory Tracker",
    description: "Tracks stock levels and reorder alerts for a small campus store.",
    owner_name: "Luis Moreno",
    members: [
      { name: "Kim Nguyen", active_status: "active" },
      { name: "Omar Haddad", active_status: "active" },
      { name: "Sara Cole", active_status: "active" },
    ],
    requirements: {
      items: { name: "Item catalog", type: "functional", estimate: 8, description: "Add, edit, and remove stock items." },
      alerts: { name: "Low-stock alerts", type: "functional", estimate: 6, description: "Flag items below their reorder level." },
      accuracy: { name: "Stock counts never negative", type: "non-functional", estimate: 3, description: "Quantities cannot drop below zero." },
    },
    risks: [
      { name: "Barcode scanner support", description: "Store scanners may not work with the browser.", priority: "medium", probability: 3, impact: 2, status: "open" },
      { name: "Unclear reorder rules", description: "Manager has not confirmed reorder thresholds.", priority: "high", probability: 4, impact: 3, status: "open" },
    ],
    effort: [
      ["items", "Kim Nguyen", "Requirements Analysis", 1.5, "2026-10-08"],
      ["items", "Omar Haddad", "Design", 2, "2026-10-15"],
      ["items", "Omar Haddad", "Coding", 3, "2026-10-22"],
      ["alerts", "Sara Cole", "Design", 1, "2026-10-16"],
      ["alerts", "Sara Cole", "Coding", 2.5, "2026-11-05"],
      ["accuracy", "Kim Nguyen", "Testing", 1, "2026-11-13"],
      ["items", "Kim Nguyen", "Project Management", 1, "2026-11-14"],
    ],
  },
  {
    // A project with a team but no requirements, for testing empty states
    name: "Library Kiosk Redesign",
    description: "Early planning; requirements not written yet.",
    owner_name: "Grace Park",
    members: [{ name: "Ivy Brooks", active_status: "active" }],
    requirements: {},
    risks: [],
    effort: [],
  },
];

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const append = args.includes("--append");

const existing = db.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
if (existing > 0 && !reset && !append) {
  console.log(`The database already has ${existing} project(s). Nothing was changed.`);
  console.log("Use  npm run seed -- --reset   to delete everything and reseed,");
  console.log("or   npm run seed -- --append  to add the seed data alongside it.");
  process.exit(0);
}

const insertProject = db.prepare("INSERT INTO projects (name, description, owner_name) VALUES (?, ?, ?)");
const insertMember = db.prepare("INSERT INTO members (project_id, name, active_status) VALUES (?, ?, ?)");
const insertRequirement = db.prepare("INSERT INTO requirements (project_id, name, description, type, estimate) VALUES (?, ?, ?, ?, ?)");
const insertRisk = db.prepare("INSERT INTO risks (project_id, name, description, priority, probability, impact, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
const insertEffort = db.prepare("INSERT INTO effort (requirement_id, member_id, phase, hours, date) VALUES (?, ?, ?, ?, ?)");

// All-or-nothing: if any insert fails, nothing is saved
const seed = db.transaction(() => {
  if (reset) {
    for (const table of ["effort", "risks", "requirements", "members", "projects"]) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    db.prepare("DELETE FROM sqlite_sequence").run(); // restart IDs at 1
  }

  const summary = [];
  for (const project of seedProjects) {
    const projectId = insertProject.run(project.name, project.description, project.owner_name).lastInsertRowid;

    const memberIds = {};
    for (const member of project.members) {
      memberIds[member.name] = insertMember.run(projectId, member.name, member.active_status).lastInsertRowid;
    }

    const requirementIds = {};
    for (const [key, req] of Object.entries(project.requirements)) {
      requirementIds[key] = insertRequirement.run(projectId, req.name, req.description, req.type, req.estimate).lastInsertRowid;
    }

    for (const risk of project.risks) {
      insertRisk.run(projectId, risk.name, risk.description, risk.priority, risk.probability, risk.impact, risk.status);
    }

    let totalHours = 0;
    for (const [reqKey, memberName, phase, hours, date] of project.effort) {
      if (!(reqKey in requirementIds) || !(memberName in memberIds)) {
        throw new Error(`Seed data error in "${project.name}": unknown requirement "${reqKey}" or member "${memberName}"`);
      }
      insertEffort.run(requirementIds[reqKey], memberIds[memberName], phase, hours, date);
      totalHours += hours;
    }

    summary.push({
      project_id: Number(projectId),
      project: project.name,
      members: project.members.length,
      requirements: Object.keys(project.requirements).length,
      risks: project.risks.length,
      effort_entries: project.effort.length,
      total_hours: totalHours,
    });
  }
  return summary;
});

const summary = seed();
console.log(reset ? "Database reset and seeded:" : "Seed data added:");
console.table(summary);

# Project Management System

**SWE 4663 | Section W01 | Group 3**

---

This is a web application built for software project managers to log, update, and view project details, team members, requirements, effort, and risks. It also prepares relevant reports such as hours-by-requirement, hours-by-phase, and hours-by-member.

## Features

**Project Info:** Create, view, edit, and delete projects. Record project description and manager name (owner).

**Team Roster:** Add and view team members as a project progresses. Mark team members as active or inactive in a project. Retain attribution for previously recorded effort.

**Requirements:** Enter, view, edit, and delete requirements associated with a selected project. 

**Effort:** Record person-hours on a daily or weekly basis against a requirement, team member, and one of the five development phases (Requirements Analysis, Design, Coding, Testing, and Project Management).

**Risks:** Enter, view, edit, and delete project risks and update their status. Risks are automatically ranked in descending order of exposure (probability x impact).

**Reports:** Display total expended hours for each requirement (including a breakdown by phase), development phase, and team member. Compare estimated to actual hours towards a requirement and flag when actual exceeds the estimate.

## Installation

### Prerequisites
* Node.js v26.13.0 or newer
* Web browser
* Git, if cloning repository

### Setup
1. Clone the repository or unzip the project folder.
2. Install the backend: open a terminal in the project's backend folder, and run the following.
   ```
   npm install
   ```
3. Install the frontend: open a terminal in the project's frontend folder, and run the following.
   ```
   npm install
   ```

## Run the application
1. Run the backend: in the backend terminal, run the following.
   ```
   npm run dev
   ```
2. Run the frontend: in the frontend terminal, run the following.
   ```
   npm run dev
   ```
3. Open http://localhost:5173 in the web browser.

Keep both terminals running while using the application. The database file, `projects.db`, will be created in the backend folder upon first run.

## Usage
1. Click the 'New Project' button to create a new project. Enter name, description, and owner/manager name, and then save project.
2. Click 'Open Project' on a project's card to select that project and view its dashboard.
3. Click 'Team' on the sidebar, enter a name in the 'Member Name' field, and then click 'Add Member' to create a new member of the project team.
4. Click 'Requirements' on the sidebar and then 'Add Requirement'. Enter new requirement name, description, type, and estimated hours and then save to create a new requirement.
5. Click 'Effort & Hours' on the sidebar and then 'Log effort'. Enter effort entry requirement, team member, phase, hours, and date. Click 'Add' to create the new effort entry. There must be an active team member and a requirement logged before you can log effort.
6. Click 'Risks' on the sidebar and then 'Add risk'. Enter a new risk name, description, priority, probability, and impact. Click 'Save risk' to log the new risk. You can also view all risks, ranked by exposure.
7. Click 'Reports' on the sidebar to view hours by phase, hours by requirement, hours by team member, and estimate vs actual hours for requirements.

## Notes
* The database is local to your computer.
* Members cannot be renamed or deleted. Members should be marked as 'Inactive' to effectively 'remove' them from a project.
* Refreshing the browser deselects the current project.

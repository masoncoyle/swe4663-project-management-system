# Backend API Guide

This file explains how the frontend talks to the backend. Each section lists the routes, what to send, and what comes back.

## The basics

- The backend runs on **port 3000**. In the frontend, call paths that start with `/api/` (for example `/api/members?project_id=1`) and let the Vite proxy forward them.
- Send and receive **JSON**. When you send data (POST or PUT), set the header `Content-Type: application/json`.
- Field names use **snake_case** (`project_id`, `active_status`). Send them exactly as written here.
- **Errors** come back as `{ "error": "message" }`. Show that message to the user.
  - **400** means something you sent was missing or invalid.
  - **404** means the record was not found.
- **Creating** (POST) returns **201** with the new record, including its new id.
- **Editing** (PUT) replaces the whole record, so send every field the route asks for. Pre-fill the edit form with the current values.
- Optional fields that are empty come back as `null`. Don't display the word "null".
- **Lists return everything** for the project (or requirement). Filtering and sorting (for example, only active members or only open risks) is done in the frontend.

### After pulling the latest code

Delete your local `backend/projects.db` and restart the backend. The database tables changed, and an old database file will cause confusing errors. Do this again any time the table definitions in `backend/utils/db.js` change.

## Allowed values (spelling and capitals matter)

| Field | Allowed values |
|---|---|
| Requirement `type` | `functional`, `non-functional` |
| Risk `status` | `open`, `mitigating`, `closed` |
| Risk `priority` (optional) | `low`, `medium`, `high` |
| Risk `probability` and `impact` | whole numbers from 1 to 5 |
| Member `active_status` | `active`, `inactive` |
| Effort `phase` | `Requirements Analysis`, `Design`, `Coding`, `Testing`, `Project Management` |
| Effort `hours` | a number greater than 0 (decimals are fine) |
| Requirement `estimate` (optional) | a number, 0 or more (hours) |
| Effort `date` | a date as `YYYY-MM-DD` |

For dates, use an `<input type="date">`, which gives the right format. The backend only checks that a date was sent, not that it is formatted correctly.

## Projects

| What | Route |
|---|---|
| List all projects | `GET /api/projects` |
| Get one project | `GET /api/projects/:project_id` |
| Create a project | `POST /api/projects` |
| Edit a project | `PUT /api/projects/:project_id` |
| Delete a project | `DELETE /api/projects/:project_id` |

**Fields:** `name` (required), `description`, `owner_name`.

Deleting a project also deletes everything inside it (members, requirements, risks and effort). Ask the user to confirm first.

## Members

| What | Route |
|---|---|
| List a project's members | `GET /api/members?project_id=1` |
| Get one member | `GET /api/members/:member_id` |
| Add a member | `POST /api/members` |
| Edit a member | `PUT /api/members/:member_id` |

**Add a member:** send `project_id` and `name` (both required). `active_status` is optional and becomes `active` if you leave it out.

**Edit a member:** send `name` and `active_status`. A member cannot move to another project.

**There is no delete for members.** To remove someone from the team, edit them and set `active_status` to `inactive`. Their past hours stay on record. Show inactive members as removed, and don't offer them in the "add effort" form.

## Requirements

| What | Route |
|---|---|
| List a project's requirements | `GET /api/requirements?project_id=1` |
| Get one requirement | `GET /api/requirements/:requirement_id` |
| Add a requirement | `POST /api/requirements` |
| Edit a requirement | `PUT /api/requirements/:requirement_id` |
| Delete a requirement | `DELETE /api/requirements/:requirement_id` |

**Add a requirement:** `project_id`, `name` and `type` are required. `description` and `estimate` are optional.

**Edit a requirement:** `name` and `type` are required. Send `description` and `estimate` too (leaving one out clears it). A requirement cannot move to another project.

Deleting a requirement also deletes its effort entries. Ask the user to confirm first.

## Effort (hours worked)

| What | Route |
|---|---|
| List the effort entries of a requirement | `GET /api/effort?requirement_id=1` |
| Get one effort entry | `GET /api/effort/:effort_id` |
| Add an effort entry | `POST /api/effort` |
| Edit an effort entry | `PUT /api/effort/:effort_id` |
| Delete an effort entry | `DELETE /api/effort/:effort_id` |

**Add an entry:** all five are required: `requirement_id`, `member_id`, `phase`, `hours`, `date`. If the requirement or the member does not exist, you get a 400.

**Edit an entry:** send `member_id`, `phase`, `hours` and `date`. The requirement cannot be changed; to move hours to a different requirement, delete the entry and add a new one.

The backend does **not** check that the member and the requirement belong to the same project, so the form should only list that project's members and requirements. It also does not block inactive members, so leave them out of the member dropdown.

## Risks

| What | Route |
|---|---|
| List a project's risks | `GET /api/risks?project_id=1` |
| Get one risk | `GET /api/risks/:risk_id` |
| Add a risk | `POST /api/risks` |
| Edit a risk | `PUT /api/risks/:risk_id` |
| Delete a risk | `DELETE /api/risks/:risk_id` |

**Add a risk:** `project_id`, `name`, `probability` and `impact` are required. `description` and `priority` are optional. A new risk always starts with the status `open`; do not send a status when adding.

**Edit a risk:** send `name`, `probability`, `impact` and `status` (all required), plus `description` and `priority` if you have them. This is how you move a risk from `open` to `mitigating` to `closed`.

## Reports

All reports are `GET` routes and need `?project_id=1`. Nothing is stored for them; they are calculated each time.

| Report | Route | What comes back |
|---|---|---|
| Hours per requirement, split by phase | `GET /api/reports/hours-by-requirement` | A list of rows with `requirement_id`, `name`, `phase`, `total_hours`. A requirement with no hours appears once with `phase` as `null` and `total_hours` as `0`. |
| Hours per phase | `GET /api/reports/hours-by-phase` | A list of rows with `phase` and `total_hours`. Only phases that have hours appear, in alphabetical order. Show `0` for any phase that is missing. |
| Hours per team member | `GET /api/reports/hours-by-member` | A list of rows with `member_id`, `name`, `active_status`, `total_hours`. Includes inactive members and members with `0` hours. |
| Estimate vs. actual hours | `GET /api/reports/estimate-vs-actual` | A list of rows with `requirement_id`, `name`, `estimate`, `actual_hours`, `exceeds_estimate`. `exceeds_estimate` is `1` when the actual hours are more than the estimate, and `0` if not (or if there is no estimate). |
| Risks ranked by exposure | `GET /api/reports/risks-ranked` | All the risk fields plus `exposure` (probability multiplied by impact). The most serious risk comes first; ties go to the higher impact. |

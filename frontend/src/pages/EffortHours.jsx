import { useEffect, useState } from 'react'
import { Button, Card, DataTable, Modal } from '../components/UI.jsx'

const columns = [
    { key: 'date', label: 'Date' },
    { key: 'requirement', label: 'Requirement' },
    { key: 'member', label: 'Team Member' },
    { key: 'phase', label: 'Phase' },
    { key: 'hours', label: 'Hours' },
]

const phases = ['Requirements Analysis', 'Design', 'Coding', 'Testing', 'Project Management']

const BACKEND_ERROR = 'There was an issue reaching the backend for information.'
const CLIENT_ERROR = 'There was an issue with the application, please retry.'

// Today's date as YYYY-MM-DD in local time (toISOString would give the UTC date)
function today() {
    return new Date().toLocaleDateString('en-CA')
}

// Marks errors that came from the server, so they get the backend message
class BackendError extends Error {}

// fetch() + response.ok check. Any failure to reach the server or non-2xx
// response becomes a BackendError; the details go to the console.
async function fetchFromBackend(url, options) {
    let response
    try {
        response = await fetch(url, options)
    } catch (error) {
        throw new BackendError(`Could not reach ${url}: ${error.message}`)
    }
    if (!response.ok) {
        throw new BackendError(`${options?.method ?? 'GET'} ${url} returned ${response.status}: ${await response.text()}`)
    }
    return response.json()
}

export default function EffortHours({ project }) {
    const [rows, setRows] = useState([])
    const [requirements, setRequirements] = useState([])
    const [members, setMembers] = useState([])
    const [loadError, setLoadError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    // null = form closed, { effort_id: null } = adding, a row = editing that row
    const [editingEntry, setEditingEntry] = useState(null)
    // null = no delete dialog, a row = asking to delete that row
    const [deletingEntry, setDeletingEntry] = useState(null)
    const [formError, setFormError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const projectId = project?.project_id

    useEffect(() => {
        // Nothing to load until a project is selected
        if (!projectId) return

        async function loadEffort() {
            try {
                // There is no "effort by project" endpoint yet, so get the project's
                // requirements first, then the effort logged against each one
                const [loadedRequirements, loadedMembers] = await Promise.all([
                    fetchFromBackend(`/api/requirements?project_id=${projectId}`),
                    fetchFromBackend(`/api/members?project_id=${projectId}`),
                ])
                const entries = (await Promise.all(
                    loadedRequirements.map((requirement) => fetchFromBackend(`/api/effort?requirement_id=${requirement.requirement_id}`))
                )).flat()

                // Effort entries only store IDs, so look up the names to display
                const requirementNames = Object.fromEntries(loadedRequirements.map((r) => [r.requirement_id, r.name]))
                const memberNames = Object.fromEntries(loadedMembers.map((m) => [m.member_id, m.name]))

                setRequirements(loadedRequirements)
                setMembers(loadedMembers)
                setRows(entries.map((entry) => ({
                    effort_id: entry.effort_id,
                    date: entry.date,
                    requirement_id: entry.requirement_id, // IDs kept so the edit form can pre-select them
                    member_id: entry.member_id,
                    requirement: requirementNames[entry.requirement_id],
                    member: memberNames[entry.member_id],
                    phase: entry.phase,
                    hours: entry.hours,
                })))
                setLoadError('')
            } catch (error) {
                console.error('Error loading effort hours.', error)
                setLoadError(error instanceof BackendError ? BACKEND_ERROR : CLIENT_ERROR)
            }
        }
        loadEffort()
    }, [projectId, reloadKey])

    const activeMembers = members.filter((member) => member.active_status === 'active')
    const canAddEffort = requirements.length > 0 && activeMembers.length > 0
    const totalHours = rows.reduce((sum, row) => sum + row.hours, 0)

    const isEditing = editingEntry?.effort_id != null

    function openAddForm() {
        setFormError('')
        setEditingEntry({ effort_id: null })
    }

    function openEditForm(row) {
        setFormError('')
        setEditingEntry(row)
    }

    function openDeleteDialog(row) {
        setFormError('')
        setDeletingEntry(row)
    }

    function closeDialogs() {
        setEditingEntry(null)
        setDeletingEntry(null)
        setFormError('')
    }

    // Handles both Add (POST) and Edit (PUT)
    async function handleSubmit(event) {
        event.preventDefault()
        setFormError('')
        setIsSaving(true)
        try {
            const values = new FormData(event.currentTarget)
            const entry = {
                requirement_id: Number(values.get('requirement_id')),
                member_id: Number(values.get('member_id')),
                phase: values.get('phase'),
                hours: Number(values.get('hours')),
                date: values.get('date'),
            }

            await fetchFromBackend(isEditing ? `/api/effort/${editingEntry.effort_id}` : '/api/effort', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            })

            // Saved: close the form and reload the table so it shows the change
            closeDialogs()
            setReloadKey((key) => key + 1)
        } catch (error) {
            console.error(isEditing ? 'Error updating effort entry.' : 'Error adding effort entry.', error)
            setFormError(error instanceof BackendError ? BACKEND_ERROR : CLIENT_ERROR)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete() {
        setFormError('')
        setIsSaving(true)
        try {
            await fetchFromBackend(`/api/effort/${deletingEntry.effort_id}`, { method: 'DELETE' })

            // Deleted on the server: remove the row locally (no reload needed)
            const deletedId = deletingEntry.effort_id
            setRows((currentRows) => currentRows.filter((row) => row.effort_id !== deletedId))
            closeDialogs()
        } catch (error) {
            console.error('Error deleting effort entry.', error)
            setFormError(error instanceof BackendError ? BACKEND_ERROR : CLIENT_ERROR)
        } finally {
            setIsSaving(false)
        }
    }

    const tableColumns = [
        ...columns,
        { key: 'actions', label: 'Actions', render: (row) => (
            <div className="table-actions">
                <button className="text-button" type="button" onClick={() => openEditForm(row)}>Edit</button>
                <button className="text-button text-button--danger" type="button" onClick={() => openDeleteDialog(row)}>Delete</button>
            </div>
        ) },
    ]

    // When editing, keep the entry's current member selectable even if they are now inactive
    const memberOptions = members.filter((member) => (
        member.active_status === 'active' || member.member_id === editingEntry?.member_id
    ))

    const heading = (
        <section className="page-heading requirements-page-heading">
            <div>
                <p className="eyebrow">Effort Hours</p>
                <h1>Effort & Hours</h1>
                <p>Hours logged against each requirement.</p>
            </div>
            {project && (
                <Button type="button" onClick={openAddForm} disabled={!canAddEffort}>Log effort</Button>
            )}
        </section>
    )

    // Same prompt style as the Requirements and Risks pages
    if (!project) {
        return (
            <>
                {heading}
                <Card className="empty-requirements">
                    <p>Select a project to view its effort hours.</p>
                </Card>
            </>
        )
    }

    return (
        <>
            {heading}

            {loadError && <p className="form-error" role="alert">{loadError}</p>}

            <Card className="effort-card">
                <div className="card-heading">
                    <h2> Total Hours: {totalHours.toFixed(1)}</h2>
                </div>
                <DataTable columns={tableColumns} rows={rows} rowKey={(row) => row.effort_id} emptyMessage="No hours have been logged." />
            </Card>

            {editingEntry && (
                <Modal title={isEditing ? 'Edit effort entry' : 'Log effort'} onClose={closeDialogs}>
                    {/* When editing, every field starts with the row's current value */}
                    <form className="project-form" onSubmit={handleSubmit}>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <label className="form-field">
                            <span>Requirement</span>
                            <select name="requirement_id" defaultValue={editingEntry.requirement_id ?? ''} required autoFocus>
                                <option value="" disabled>Select a requirement</option>
                                {requirements.map((requirement) => (
                                    <option key={requirement.requirement_id} value={requirement.requirement_id}>
                                        {requirement.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Team member</span>
                            <select name="member_id" defaultValue={editingEntry.member_id ?? ''} required>
                                <option value="" disabled>Select a team member</option>
                                {memberOptions.map((member) => (
                                    <option key={member.member_id} value={member.member_id}>
                                        {member.name}{member.active_status === 'inactive' ? ' (inactive)' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Phase</span>
                            <select name="phase" defaultValue={editingEntry.phase ?? ''} required>
                                <option value="" disabled>Select a phase</option>
                                {phases.map((phase) => <option key={phase}>{phase}</option>)}
                            </select>
                        </label>
                        <div className="form-row">
                            <label className="form-field">
                                <span>Hours</span>
                                <input name="hours" type="number" min="0.25" max="168" step="0.25" required placeholder="e.g. 2.5" defaultValue={editingEntry.hours} />
                            </label>
                            <label className="form-field">
                                <span>Date</span>
                                <input name="date" type="date" defaultValue={editingEntry.date ?? today()} max={today()} required />
                            </label>
                        </div>
                        <div className="form-actions">
                            <Button variant="secondary" type="button" onClick={closeDialogs}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isEditing ? (isSaving ? 'Saving…' : 'Save') : (isSaving ? 'Adding…' : 'Add')}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {deletingEntry && (
                <Modal title="Delete effort entry" onClose={closeDialogs}>
                    <div className="project-form">
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <p>
                            Delete {deletingEntry.hours} hours of {deletingEntry.phase} by {deletingEntry.member} on
                            {' '}"{deletingEntry.requirement}" ({deletingEntry.date})? This cannot be undone.
                        </p>
                        <div className="form-actions">
                            <Button variant="secondary" type="button" onClick={closeDialogs}>Cancel</Button>
                            <Button type="button" onClick={handleDelete} disabled={isSaving}>
                                {isSaving ? 'Deleting…' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    )
}

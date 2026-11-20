import { useEffect, useState } from 'react'
import { Button, Card, DataTable, Modal } from '../components/UI.jsx'

const riskStatuses = [
  { value: 'open', label: 'Open' },
  { value: 'mitigating', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
]

const emptyRisk = {
  name: '',
  description: '',
  priority: 'medium',
  probability: 3,
  impact: 3,
  status: 'open',
}

function titleCase(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : ''
}

export default function RisksPage({ project }) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('all')
  const [editingRisk, setEditingRisk] = useState(null)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const [snapshot, setSnapshot] = useState({ projectId: null, version: -1, risks: [], error: '' })
  const projectId = project?.project_id
  const risks = snapshot.projectId === projectId ? snapshot.risks : []
  const loading = Boolean(projectId) && (snapshot.projectId !== projectId || snapshot.version !== reloadCount)
  const loadError = snapshot.projectId === projectId && snapshot.version === reloadCount ? snapshot.error : ''
  const openCount = risks.filter((risk) => risk.status === 'open').length
  const inProgressCount = risks.filter((risk) => risk.status === 'mitigating').length
  const closedCount = risks.filter((risk) => risk.status === 'closed').length

  // Load risk records in exposure order
  useEffect(() => {
    if (!projectId) return undefined
    const controller = new AbortController()

    fetch(`/api/reports/risks-ranked?project_id=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load risks')
        return response.json()
      })
      .then((items) => setSnapshot({ projectId, version: reloadCount, risks: items, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setSnapshot({ projectId, version: reloadCount, risks: [], error: 'Could not load risks. Check that the server is running, then try again.' })
        }
      })

    return () => controller.abort()
  }, [projectId, reloadCount])

  const filteredRisks = risks.filter((risk) => {
    const matchesStatus = activeStatus === 'all' || risk.status === activeStatus
    const matchesSearch = `${risk.name} ${risk.description}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  function openCreateForm() {
    setFormError('')
    setEditingRisk({ ...emptyRisk })
  }

  function openEditForm(risk) {
    setFormError('')
    setEditingRisk({ ...risk })
  }

  async function saveRisk(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const details = {
      name: String(values.get('name') ?? '').trim(),
      description: String(values.get('description') ?? '').trim(),
      priority: String(values.get('priority') ?? 'medium'),
      probability: Number(values.get('probability')),
      impact: Number(values.get('impact')),
      status: String(values.get('status') ?? 'open'),
    }

    setSaving(true)
    setFormError('')
    try {
      const isEditing = Boolean(editingRisk.risk_id)
      const response = await fetch(
        isEditing ? `/api/risks/${editingRisk.risk_id}` : '/api/risks',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEditing ? details : { ...details, project_id: projectId }),
        },
      )
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not save this risk.')
      }
      setEditingRisk(null)
      setRequestError('')
      setReloadCount((count) => count + 1)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(risk, status) {
    try {
      const response = await fetch(`/api/risks/${risk.risk_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: risk.name,
          description: risk.description,
          priority: risk.priority,
          probability: risk.probability,
          impact: risk.impact,
          status,
        }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not update the risk status.')
      }
      setRequestError('')
      setReloadCount((count) => count + 1)
    } catch (error) {
      setRequestError(error.message)
    }
  }

  async function deleteRisk(risk) {
    if (!window.confirm(`Delete "${risk.name}"?`)) return
    try {
      const response = await fetch(`/api/risks/${risk.risk_id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not delete this risk.')
      }
      setRequestError('')
      setReloadCount((count) => count + 1)
    } catch (error) {
      setRequestError(error.message)
    }
  }

  const columns = [
    { key: 'name', label: 'Risk' },
    { key: 'description', label: 'Description' },
    { key: 'probability', label: 'Probability', render: (risk) => `${risk.probability}/5` },
    { key: 'impact', label: 'Impact', render: (risk) => `${risk.impact}/5` },
    { key: 'exposure', label: 'Exposure', render: (risk) => <strong>{risk.exposure}</strong> },
    { key: 'priority', label: 'Priority', render: (risk) => (
      <span className={`priority-badge priority-badge--${risk.priority}`}>{titleCase(risk.priority)}</span>
    ) },
    { key: 'status', label: 'Status', render: (risk) => (
      <select
        className={`risk-status-select risk-status-select--${risk.status}`}
        value={risk.status}
        aria-label={`Update status for risk: ${risk.name}`}
        onChange={(event) => updateStatus(risk, event.target.value)}
      >
        {riskStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
      </select>
    ) },
    { key: 'actions', label: 'Actions', render: (risk) => (
      <div className="table-actions">
        <button className="text-button" type="button" onClick={() => openEditForm(risk)}>Edit</button>
        <button className="text-button text-button--danger" type="button" onClick={() => deleteRisk(risk)}>Delete</button>
      </div>
    ) },
  ]

  return (
    <>
      <section className="page-heading requirements-page-heading">
        <div>
          <h1>Risks</h1>
          <p>{project ? `Risks for ${project.name}, ranked from highest exposure to lowest.` : 'Choose a project to manage its risks.'}</p>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={!project}>Add risk</Button>
      </section>

      {project ? (
        <>
          {(loadError || requestError) && (
            <Card className="dashboard-error" role="alert">
              <p>{loadError || requestError}</p>
              {loadError && <Button variant="secondary" type="button" onClick={() => setReloadCount((count) => count + 1)}>Try again</Button>}
            </Card>
          )}
          <section className="requirements-summary risk-summary" aria-label="Risk totals">
            <Card className="requirement-stat"><span>All risks</span><strong>{loading ? '—' : risks.length}</strong></Card>
            <Card className="requirement-stat"><span>Open</span><strong>{loading ? '—' : openCount}</strong></Card>
            <Card className="requirement-stat"><span>In progress</span><strong>{loading ? '—' : inProgressCount}</strong></Card>
            <Card className="requirement-stat"><span>Closed</span><strong>{loading ? '—' : closedCount}</strong></Card>
          </section>

          <Card className="requirements-list-card">
            <div className="requirements-toolbar">
              <div className="requirement-filters" aria-label="Filter risks by status">
                {[{ value: 'all', label: 'All' }, ...riskStatuses].map((status) => (
                  <button
                    key={status.value}
                    className={`filter-button ${activeStatus === status.value ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={activeStatus === status.value}
                    onClick={() => setActiveStatus(status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
              <label className="search-field requirements-search">
                <span className="visually-hidden">Search risks</span>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search risks" />
              </label>
            </div>
            <DataTable
              columns={columns}
              rows={loading ? [] : filteredRisks}
              rowKey={(risk) => risk.risk_id}
              emptyMessage={loading ? 'Loading risks...' : risks.length ? 'No matching risks.' : 'No risks added yet.'}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-requirements"><p>Select a project before adding risks.</p></Card>
      )}

      {editingRisk && (
        <Modal title={editingRisk.risk_id ? 'Edit risk' : 'Add risk'} onClose={() => setEditingRisk(null)}>
          <form className="project-form" onSubmit={saveRisk}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="form-field">
              <span>Risk name</span>
              <input name="name" defaultValue={editingRisk.name} required maxLength={120} autoFocus />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea name="description" defaultValue={editingRisk.description} rows={3} maxLength={500} />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Priority</span>
                <select name="priority" defaultValue={editingRisk.priority}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="form-field">
                <span>Probability (1–5)</span>
                <select name="probability" defaultValue={editingRisk.probability}>
                  {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Impact (1–5)</span>
                <select name="impact" defaultValue={editingRisk.impact}>
                  {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                </select>
              </label>
            </div>
            {editingRisk.risk_id && (
              <label className="form-field">
                <span>Status</span>
                <select name="status" defaultValue={editingRisk.status}>
                  {riskStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </label>
            )}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => setEditingRisk(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save risk'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

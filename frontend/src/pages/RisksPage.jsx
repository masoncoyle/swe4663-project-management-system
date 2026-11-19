import { useState } from 'react'
import { Button, Card, DataTable, Modal } from '../components/UI.jsx'

const riskStatuses = ['Open', 'Monitoring', 'Resolved']
const emptyRisk = { id: '', description: '', status: 'Open' }

export default function RisksPage({ project, onUpdateRisks }) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [editingRisk, setEditingRisk] = useState(null)
  const [formError, setFormError] = useState('')
  const risks = project?.risks ?? []
  const openCount = risks.filter((risk) => risk.status === 'Open').length
  const monitoringCount = risks.filter((risk) => risk.status === 'Monitoring').length
  const resolvedCount = risks.filter((risk) => risk.status === 'Resolved').length

  // Filter risks by status and description
  const filteredRisks = risks.filter((risk) => {
    const matchesStatus = activeStatus === 'All' || risk.status === activeStatus
    const matchesSearch = risk.description.toLowerCase().includes(search.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  function openCreateForm() {
    setFormError('')
    setEditingRisk({ ...emptyRisk })
  }

  function openEditForm(risk) {
    setFormError('')
    setEditingRisk(risk)
  }

  function closeForm() {
    setEditingRisk(null)
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const description = String(values.get('description') ?? '').trim()
    const status = String(values.get('status') ?? 'Open')

    if (!description) {
      setFormError('Enter a risk description.')
      return
    }

    const nextRisk = {
      id: editingRisk.id || `risk-${Date.now()}`,
      description,
      status,
    }
    const nextRisks = editingRisk.id
      ? risks.map((risk) => (risk.id === editingRisk.id ? nextRisk : risk))
      : [...risks, nextRisk]
    onUpdateRisks(nextRisks)
    closeForm()
  }

  // Change status directly from the risk list
  function updateRiskStatus(riskId, status) {
    onUpdateRisks(risks.map((risk) => (
      risk.id === riskId ? { ...risk, status } : risk
    )))
  }

  function confirmDelete(risk) {
    if (!window.confirm('Delete this risk?')) return
    onUpdateRisks(risks.filter((item) => item.id !== risk.id))
  }

  const columns = [
    { key: 'description', label: 'Risk description' },
    { key: 'status', label: 'Status', render: (risk) => (
      <select
        className={`risk-status-select risk-status-select--${risk.status.toLowerCase()}`}
        value={risk.status}
        aria-label={`Update status for risk: ${risk.description}`}
        onChange={(event) => updateRiskStatus(risk.id, event.target.value)}
      >
        {riskStatuses.map((status) => <option key={status}>{status}</option>)}
      </select>
    ) },
    { key: 'actions', label: 'Actions', render: (risk) => (
      <div className="table-actions">
        <button className="text-button" type="button" onClick={() => openEditForm(risk)}>Edit</button>
        <button className="text-button text-button--danger" type="button" onClick={() => confirmDelete(risk)}>Delete</button>
      </div>
    ) },
  ]

  return (
    <>
      <section className="page-heading requirements-page-heading">
        <div>
          <h1>Risks</h1>
          <p>
            {project
              ? `Track and update risks for ${project.name}.`
              : 'Choose a project to manage its risks.'}
          </p>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={!project}>Add risk</Button>
      </section>

      {project ? (
        <>
          <section className="requirements-summary risk-summary" aria-label="Risk totals">
            <Card className="requirement-stat">
              <span>All risks</span><strong>{risks.length}</strong>
            </Card>
            <Card className="requirement-stat">
              <span>Open</span><strong>{openCount}</strong>
            </Card>
            <Card className="requirement-stat">
              <span>Monitoring</span><strong>{monitoringCount}</strong>
            </Card>
            <Card className="requirement-stat">
              <span>Resolved</span><strong>{resolvedCount}</strong>
            </Card>
          </section>

          <Card className="requirements-list-card">
            <div className="requirements-toolbar">
              <div className="requirement-filters" aria-label="Filter risks by status">
                {['All', ...riskStatuses].map((status) => (
                  <button
                    key={status}
                    className={`filter-button ${activeStatus === status ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={activeStatus === status}
                    onClick={() => setActiveStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <label className="search-field requirements-search">
                <span className="visually-hidden">Search risks</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search risks"
                />
              </label>
            </div>
            <DataTable
              columns={columns}
              rows={filteredRisks}
              rowKey={(risk) => risk.id}
              emptyMessage={risks.length ? 'No matching risks.' : 'No risks added yet.'}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-requirements">
          <p>Select a project before adding risks.</p>
        </Card>
      )}

      {editingRisk && (
        <Modal title={editingRisk.id ? 'Edit risk' : 'Add risk'} onClose={closeForm}>
          <form className="project-form" onSubmit={handleSubmit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="form-field">
              <span>Risk description</span>
              <textarea name="description" defaultValue={editingRisk.description} required rows={3} maxLength={500} autoFocus />
            </label>
            <label className="form-field">
              <span>Status</span>
              <select name="status" defaultValue={editingRisk.status}>
                {riskStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
              <Button type="submit">Save risk</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

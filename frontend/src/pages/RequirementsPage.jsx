import { useEffect, useState } from 'react'
import { Button, Card, DataTable, Modal, StatusBadge } from '../components/UI.jsx'

const emptyRequirement = {
  name: '',
  description: '',
  type: 'functional',
  estimate: '',
}

const requirementTypes = [
  { value: 'functional', label: 'Functional' },
  { value: 'non-functional', label: 'Non-functional' },
]

function requirementLabel(id) {
  return `REQ-${String(id).padStart(3, '0')}`
}

function formatHours(hours) {
  if (hours === null || hours === undefined || hours === '') return '—'
  const value = Number(hours)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export default function RequirementsPage({ project }) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [editingRequirement, setEditingRequirement] = useState(null)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const [snapshot, setSnapshot] = useState({ projectId: null, version: -1, requirements: [], error: '' })
  const projectId = project?.project_id
  const requirements = snapshot.projectId === projectId ? snapshot.requirements : []
  const loading = Boolean(projectId) && (snapshot.projectId !== projectId || snapshot.version !== reloadCount)
  const loadError = snapshot.projectId === projectId && snapshot.version === reloadCount ? snapshot.error : ''
  const functionalCount = requirements.filter((item) => item.type === 'functional').length
  const nonFunctionalCount = requirements.filter((item) => item.type === 'non-functional').length

  // Load this project's saved requirements
  useEffect(() => {
    if (!projectId) return undefined
    const controller = new AbortController()

    fetch(`/api/requirements?project_id=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load requirements')
        return response.json()
      })
      .then((items) => setSnapshot({ projectId, version: reloadCount, requirements: items, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setSnapshot({ projectId, version: reloadCount, requirements: [], error: 'Could not load requirements. Check that the server is running, then try again.' })
        }
      })

    return () => controller.abort()
  }, [projectId, reloadCount])

  const filteredRequirements = requirements.filter((requirement) => {
    const matchesType = activeType === 'all' || requirement.type === activeType
    const matchesSearch = `${requirementLabel(requirement.requirement_id)} ${requirement.name} ${requirement.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
    return matchesType && matchesSearch
  })

  function openCreateForm() {
    setFormError('')
    setEditingRequirement({ ...emptyRequirement })
  }

  function openEditForm(requirement) {
    setFormError('')
    setEditingRequirement({ ...requirement, estimate: requirement.estimate ?? '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const estimateValue = String(values.get('estimate') ?? '').trim()
    const details = {
      name: String(values.get('name') ?? '').trim(),
      description: String(values.get('description') ?? '').trim(),
      type: String(values.get('type') ?? 'functional'),
      estimate: estimateValue === '' ? null : Number(estimateValue),
    }

    if (!details.name || !details.description) {
      setFormError('Enter a requirement name and description.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const isEditing = Boolean(editingRequirement.requirement_id)
      const response = await fetch(
        isEditing
          ? `/api/requirements/${editingRequirement.requirement_id}`
          : '/api/requirements',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEditing ? details : { ...details, project_id: projectId }),
        },
      )
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not save this requirement.')
      }
      setEditingRequirement(null)
      setRequestError('')
      setReloadCount((count) => count + 1)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteRequirement(requirement) {
    if (!window.confirm(`Delete ${requirementLabel(requirement.requirement_id)}?`)) return
    try {
      const response = await fetch(`/api/requirements/${requirement.requirement_id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not delete this requirement.')
      }
      setRequestError('')
      setReloadCount((count) => count + 1)
    } catch (error) {
      setRequestError(error.message)
    }
  }

  const columns = [
    { key: 'requirement_id', label: 'Requirement ID', render: (item) => requirementLabel(item.requirement_id) },
    { key: 'name', label: 'Requirement' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type', render: (item) => <StatusBadge status={item.type === 'non-functional' ? 'Non-functional' : 'Functional'} /> },
    { key: 'estimate', label: 'Estimate', render: (item) => formatHours(item.estimate) },
    { key: 'actions', label: 'Actions', render: (item) => (
      <div className="table-actions">
        <button className="text-button" type="button" onClick={() => openEditForm(item)}>Edit</button>
        <button className="text-button text-button--danger" type="button" onClick={() => deleteRequirement(item)}>Delete</button>
      </div>
    ) },
  ]

  return (
    <>
      <section className="page-heading requirements-page-heading">
        <div>
          <h1>Requirements</h1>
          <p>{project ? `Manage functional and non-functional requirements for ${project.name}.` : 'Choose a project to manage its requirements.'}</p>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={!project}>Add requirement</Button>
      </section>

      {project ? (
        <>
          {(loadError || requestError) && (
            <Card className="dashboard-error" role="alert">
              <p>{loadError || requestError}</p>
              {loadError && <Button variant="secondary" type="button" onClick={() => setReloadCount((count) => count + 1)}>Try again</Button>}
            </Card>
          )}
          <section className="requirements-summary" aria-label="Requirement totals">
            <Card className="requirement-stat"><span>All requirements</span><strong>{loading ? '—' : requirements.length}</strong></Card>
            <Card className="requirement-stat"><span>Functional</span><strong>{loading ? '—' : functionalCount}</strong></Card>
            <Card className="requirement-stat"><span>Non-functional</span><strong>{loading ? '—' : nonFunctionalCount}</strong></Card>
          </section>

          <Card className="requirements-list-card">
            <div className="requirements-toolbar">
              <div className="requirement-filters" aria-label="Filter requirements by type">
                {[{ value: 'all', label: 'All' }, ...requirementTypes].map((type) => (
                  <button
                    key={type.value}
                    className={`filter-button ${activeType === type.value ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={activeType === type.value}
                    onClick={() => setActiveType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <label className="search-field requirements-search">
                <span className="visually-hidden">Search requirements</span>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requirements" />
              </label>
            </div>
            <DataTable
              columns={columns}
              rows={loading ? [] : filteredRequirements}
              rowKey={(item) => item.requirement_id}
              emptyMessage={loading ? 'Loading requirements...' : requirements.length ? 'No matching requirements.' : 'No requirements added yet.'}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-requirements"><p>Select a project before adding requirements.</p></Card>
      )}

      {editingRequirement && (
        <Modal title={editingRequirement.requirement_id ? 'Edit requirement' : 'Add requirement'} onClose={() => setEditingRequirement(null)}>
          <form className="project-form" onSubmit={handleSubmit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="form-field">
              <span>Requirement name</span>
              <input name="name" defaultValue={editingRequirement.name} required maxLength={120} autoFocus />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea name="description" defaultValue={editingRequirement.description} required rows={3} maxLength={500} />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Type</span>
                <select name="type" defaultValue={editingRequirement.type}>
                  {requirementTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Estimated hours</span>
                <input name="estimate" type="number" min="0" step="0.1" defaultValue={editingRequirement.estimate} />
              </label>
            </div>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => setEditingRequirement(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save requirement'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

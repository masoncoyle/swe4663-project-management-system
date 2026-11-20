import { useState, useEffect } from 'react'
import { Button, Card, DataTable, Modal, StatusBadge } from '../components/UI.jsx'

const emptyRequirement = {
  name: '',
  description: '',
  type: 'functional',
  estimate: '',
}

const requirementTypes = ['all', 'functional', 'non-functional']

export default function RequirementsPage({ project, onUpdateRequirements }) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [requirements, setRequirements] = useState([])
  const [editingRequirement, setEditingRequirement] = useState(null)
  const [formError, setFormError] = useState('')
  const functionalCount = requirements.filter((item) => item.type === 'functional').length
  const nonFunctionalCount = requirements.length - functionalCount

  async function loadRequirements(){
    if (!project) {
      return
    }
    const response = await fetch(`/api/requirements?project_id=${project.project_id}`)
    if (!response.ok) {
      console.error('Error loading requirements.')
      return
    }
    const loadedRequirements = await response.json()
    setRequirements(loadedRequirements)
  }

    useEffect(() => { loadRequirements() }, [project?.project_id])

  // Filter this project's requirements by type and search text
  const filteredRequirements = requirements.filter((requirement) => {
    const matchesType = activeType === 'All' || requirement.type === activeType
    const matchesSearch = `${requirement.name} ${requirement.description}`
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
    setEditingRequirement(requirement)
  }

  function closeForm() {
    setEditingRequirement(null)
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const requirementData = {
      project_id: project.project_id,
      name: String(values.get('name') ?? '').trim(),
      description: String(values.get('description') ?? '').trim(),
      type: String(values.get('type') ?? ''),
      estimate: values.get('estimate') ? Number(values.get('estimate')) : null
    }
    // Required text must contain more than spaces
    if (!requirementData.name || !requirementData.description) {
      setFormError('Enter a requirement name and description.')
      return
    }

    closeForm()
  }

  function confirmDelete(requirement) {
    if (!window.confirm(`Delete requirement ${requirement.id}?`)) return
    onUpdateRequirements(requirements.filter((item) => item.id !== requirement.id))
  }

  const columns = [
    { key: 'name', label: 'Requirement ID' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type', render: (requirement) => <StatusBadge status={requirement.type} /> },
    { key: 'actions', label: 'Actions', render: (requirement) => (
      <div className="table-actions">
        <button className="text-button" type="button" onClick={() => openEditForm(requirement)}>Edit</button>
        <button className="text-button text-button--danger" type="button" onClick={() => confirmDelete(requirement)}>Delete</button>
      </div>
    ) },
  ]

  return (
    <>
      <section className="page-heading requirements-page-heading">
        <div>
          <h1>Requirements</h1>
          <p>
            {project
              ? `Manage functional and non-functional requirements for ${project.name}.`
              : 'Choose a project to manage its requirements.'}
          </p>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={!project}>Add requirement</Button>
      </section>

      {project ? (
        <>
          <section className="requirements-summary" aria-label="Requirement totals">
            <Card className="requirement-stat">
              <span>All requirements</span><strong>{requirements.length}</strong>
            </Card>
            <Card className="requirement-stat">
              <span>Functional</span><strong>{functionalCount}</strong>
            </Card>
            <Card className="requirement-stat">
              <span>Non-functional</span><strong>{nonFunctionalCount}</strong>
            </Card>
          </section>

          <Card className="requirements-list-card">
            <div className="requirements-toolbar">
              <div className="requirement-filters" aria-label="Filter requirements by type">
                {requirementTypes.map((type) => (
                  <button
                    key={type}
                    className={`filter-button ${activeType === type ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={activeType === type}
                    onClick={() => setActiveType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <label className="search-field requirements-search">
                <span className="visually-hidden">Search requirements</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search requirements"
                />
              </label>
            </div>
            <DataTable
              columns={columns}
              rows={filteredRequirements}
              rowKey={(requirement) => requirement.requirement_id}
              emptyMessage={requirements.length ? 'No matching requirements.' : 'No requirements added yet.'}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-requirements">
          <p>Select a project before adding requirements.</p>
        </Card>
      )}

      {editingRequirement && (
        <Modal
          title={editingRequirement.id ? 'Edit requirement' : 'Add requirement'}
          onClose={closeForm}
        >
          <form className="project-form" onSubmit={handleSubmit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="form-field">
              <span>Requirement ID</span>
              <input name="name" defaultValue={editingRequirement.name} required maxLength={20} autoFocus />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea name="description" defaultValue={editingRequirement.description} required rows={3} maxLength={500} />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Type</span>
                <select name="type" defaultValue={editingRequirement.type}>
                  <option>functional</option>
                  <option>non-functional</option>
                </select>
              </label>
              <label className="form-field">
                <span>Estimated Hours</span>
                <input name="estimate" defaultValue={editingRequirement.estimate ?? ''}  type='number' min='0'/>
              </label>
            </div>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
              <Button type="submit">Save requirement</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

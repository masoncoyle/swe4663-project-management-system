import { useState } from 'react'
import { Button, Card, Modal, ProgressBar, StatusBadge } from '../components/UI.jsx'

const emptyProject = { name: '', description: '', owner: '', dueDate: '' }

export default function ProjectsPage({
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) {
  const [search, setSearch] = useState('')
  const [editingProject, setEditingProject] = useState(null)

  // Match searches against the details shown on each card
  const filteredProjects = projects.filter((project) => (
    `${project.name} ${project.description} ${project.owner}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ))

  function openCreateForm() {
    setEditingProject({ ...emptyProject, id: '' })
  }

  function openEditForm(project) {
    setEditingProject(project)
  }

  function closeForm() {
    setEditingProject(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const projectDetails = {
      name: String(values.get('name')).trim(),
      description: String(values.get('description')).trim(),
      owner: String(values.get('owner')).trim(),
      dueDate: String(values.get('dueDate')).trim() || 'Not set',
    }

    if (editingProject.id) {
      onUpdateProject({ ...editingProject, ...projectDetails })
    } else {
      onCreateProject(projectDetails)
    }
    closeForm()
  }

  // Confirm before removing a project from the current list
  function confirmDelete(project) {
    const confirmed = window.confirm(`Delete "${project.name}"?`)
    if (confirmed) onDeleteProject(project.id)
  }

  return (
    <>
      <section className="page-heading project-page-heading">
        <div>
          <h1>Hello, User</h1>
          <p>Choose a project to open it or manage its details.</p>
        </div>
        <Button type="button" onClick={openCreateForm}>New project</Button>
      </section>

      <section className="project-toolbar" aria-label="Project list controls">
        <label className="search-field">
          <span className="visually-hidden">Search projects</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
          />
        </label>
        <span className="project-count">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </section>

      {filteredProjects.length ? (
        <section className="project-grid" aria-label="Projects">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="project-card">
              <div className="project-card__heading">
                <h2>{project.name}</h2>
                <StatusBadge status={project.status} />
              </div>
              <p className="project-card__description">{project.description}</p>
              <div className="project-card__details">
                <span>Owner</span><strong>{project.owner}</strong>
                <span>Due</span><strong>{project.dueDate}</strong>
              </div>
              <div className="project-card__progress">
                <span>Progress</span><strong>{project.progress}%</strong>
                <ProgressBar value={project.progress} />
              </div>
              <div className="project-card__actions">
                <Button variant="secondary" type="button" onClick={() => onSelectProject(project.id)}>
                  Open project
                </Button>
                <button className="text-button" type="button" onClick={() => openEditForm(project)}>
                  Edit
                </button>
                <button className="text-button text-button--danger" type="button" onClick={() => confirmDelete(project)}>
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="empty-projects">
          <h2>{projects.length ? 'No projects found' : 'No projects yet'}</h2>
          <p>{projects.length ? 'Try a different search.' : 'Create a project to get started.'}</p>
          {!projects.length && <Button type="button" onClick={openCreateForm}>New project</Button>}
        </Card>
      )}

      {editingProject && (
        <Modal
          title={editingProject.id ? 'Edit project' : 'New project'}
          onClose={closeForm}
        >
          <form className="project-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Project name</span>
              <input name="name" defaultValue={editingProject.name} required maxLength={80} autoFocus />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea name="description" defaultValue={editingProject.description} required rows={3} maxLength={300} />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Owner or manager</span>
                <input name="owner" defaultValue={editingProject.owner} required maxLength={80} />
              </label>
              <label className="form-field">
                <span>Due date</span>
                <input name="dueDate" type="text" defaultValue={editingProject.dueDate === 'Not set' ? '' : editingProject.dueDate} placeholder="Optional" />
              </label>
            </div>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
              <Button type="submit">Save project</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

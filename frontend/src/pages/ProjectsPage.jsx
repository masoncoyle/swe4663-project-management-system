import { Button, Card, ProgressBar, StatusBadge } from '../components/UI.jsx'

// Project cards are sample only until the project API is connected
export default function ProjectsPage({ projects, onSelectProject }) {
  return (
    <>
      <section className="page-heading">
        <h1>Hello, User</h1>
        <p>Select a project to view its overview.</p>
      </section>

      <section className="project-grid" aria-label="Sample projects">
        {projects.map((project) => (
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
            <Button variant="secondary" onClick={() => onSelectProject(project.id)}>
              Open project
            </Button>
          </Card>
        ))}
      </section>
    </>
  )
}

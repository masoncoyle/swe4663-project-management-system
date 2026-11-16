import { Button, Card, DataTable, StatusBadge } from '../components/UI.jsx'

const phaseNames = [
  'Requirements analysis',
  'Design',
  'Coding',
  'Testing',
  'Project management',
]

const phaseColumns = [
  { key: 'name', label: 'Development phase' },
  { key: 'hours', label: 'Hours' },
]

export default function DashboardPage({ project, onNavigate }) {
  const phaseRows = phaseNames.map((name) => ({
    name,
    hours: project.phases.find((phase) => phase.name === name)?.hours ?? 0,
  }))

  return (
    <>
      <section className="page-heading dashboard-heading">
        <p className="eyebrow">PROJECT OVERVIEW</p>
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </section>

      <Card className="project-summary">
        <div className="summary-topline">
          <h2>Project details</h2>
          <StatusBadge status={project.status} />
        </div>
        <dl className="details-list">
          <div><dt>Owner</dt><dd>{project.owner}</dd></div>
          <div><dt>Due date</dt><dd>{project.dueDate}</dd></div>
          <div><dt>Progress</dt><dd>{project.progress}%</dd></div>
          <div><dt>Hours logged</dt><dd>{project.hours}</dd></div>
        </dl>
      </Card>

      <Card className="effort-card">
        <div className="card-heading">
          <div>
            <h2>Effort by development phase</h2>
            <p>Sample hours for this project</p>
          </div>
        </div>
        <DataTable columns={phaseColumns} rows={phaseRows} rowKey={(phase) => phase.name} />
      </Card>

      <section className="next-step">
        <h2>Next areas to build</h2>
        <p>Team management, requirements, risk tracking, and reports are planned next.</p>
      </section>

      <Button variant="quiet" onClick={() => onNavigate('projects')}>Back to projects</Button>
    </>
  )
}

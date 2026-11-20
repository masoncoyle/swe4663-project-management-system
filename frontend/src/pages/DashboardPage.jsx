import { Button, Card, DataTable } from '../components/UI.jsx'

export default function DashboardPage({ project, onNavigate }) {

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
        </div>
        <dl className="details-list">
          <div><dt>Owner</dt><dd>{project.owner}</dd></div>
          <div><dt>Due date</dt><dd>{project.dueDate}</dd></div>
          <div><dt>Progress</dt><dd>{project.progress}%</dd></div>
          <div><dt>Hours logged</dt><dd>{project.hours}</dd></div>
        </dl>
      </Card>

      <section className="next-step">
        <h2>Next areas to build</h2>
        <p>Team management, requirements, risk tracking, and reports are planned next.</p>
      </section>

      <Button variant="quiet" onClick={() => onNavigate('projects')}>Back to projects</Button>
    </>
  )
}

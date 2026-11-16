import { Button, Card } from '../components/UI.jsx'

const pageNames = {
  team: 'Team management',
  requirements: 'Requirements',
  effort: 'Effort tracking',
  risks: 'Risk management',
  reports: 'Reports',
}

export default function PlannedPage({ page, onNavigate }) {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">PLANNED SCREEN</p>
        <h1>{pageNames[page]}</h1>
        <p>This screen will be added in a later feature step.</p>
      </section>

      <Card className="planned-card">
        <h2>Not built yet</h2>
        <p>We’ll add this area after the project selection and dashboard foundations are reviewed.</p>
      </Card>

      <Button variant="quiet" onClick={() => onNavigate('projects')}>Back to projects</Button>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Button, Card } from '../components/UI.jsx'

const phases = [
  'Requirements Analysis',
  'Design',
  'Coding',
  'Testing',
  'Project Management',
]

const initialData = {
  requirements: [],
  members: [],
  risks: [],
  phaseHours: [],
  memberHours: [],
}

function formatHours(hours) {
  const value = Number(hours ?? 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

async function loadList(path, signal) {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error('Could not load project information')
  return response.json()
}

export default function DashboardPage({ project, onNavigate }) {
  const [snapshot, setSnapshot] = useState({
    projectId: null,
    requestVersion: -1,
    data: initialData,
    error: '',
  })
  const [reloadCount, setReloadCount] = useState(0)
  const projectId = project?.project_id
  const data = snapshot.projectId === projectId ? snapshot.data : initialData
  const loading = Boolean(projectId) && (
    snapshot.projectId !== projectId || snapshot.requestVersion !== reloadCount
  )
  const error = snapshot.projectId === projectId && snapshot.requestVersion === reloadCount
    ? snapshot.error
    : ''
  const metricsPending = loading || Boolean(error)

  // Load saved project records for the overview
  useEffect(() => {
    if (!projectId) return undefined

    const controller = new AbortController()
    const query = `project_id=${encodeURIComponent(projectId)}`

    Promise.all([
      loadList(`/api/requirements?${query}`, controller.signal),
      loadList(`/api/members?${query}`, controller.signal),
      loadList(`/api/reports/risks-ranked?${query}`, controller.signal),
      loadList(`/api/reports/hours-by-phase?${query}`, controller.signal),
      loadList(`/api/reports/hours-by-member?${query}`, controller.signal),
    ])
      .then(([requirements, members, risks, phaseHours, memberHours]) => {
        setSnapshot({
          projectId,
          requestVersion: reloadCount,
          data: { requirements, members, risks, phaseHours, memberHours },
          error: '',
        })
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setSnapshot({
            projectId,
            requestVersion: reloadCount,
            data: initialData,
            error: 'Could not load this project overview. Check that the server is running, then try again.',
          })
        }
      })

    return () => controller.abort()
  }, [projectId, reloadCount])

  if (!project) {
    return (
      <>
        <section className="page-heading dashboard-heading">
          <h1>Project dashboard</h1>
          <p>Open a project to see its team, requirements, risks, and effort.</p>
        </section>
        <Card className="dashboard-empty">
          <p>Choose a project to view its dashboard.</p>
          <Button type="button" onClick={() => onNavigate('projects')}>View projects</Button>
        </Card>
      </>
    )
  }

  const phaseTotals = phases.map((phase) => ({
    name: phase,
    hours: Number(data.phaseHours.find((item) => item.phase === phase)?.total_hours ?? 0),
  }))
  const totalHours = phaseTotals.reduce((total, phase) => total + phase.hours, 0)
  const activeMembers = data.members.filter((member) => member.active_status === 'active')
  const functionalRequirements = data.requirements.filter((item) => item.type === 'functional').length
  const nonFunctionalRequirements = data.requirements.filter((item) => item.type === 'non-functional').length
  const activeRisks = data.risks.filter((risk) => risk.status !== 'closed')
  const openRisks = data.risks.filter((risk) => risk.status === 'open').length
  const topRisks = activeRisks.slice(0, 3)
  const topMembers = [...data.memberHours]
    .sort((a, b) => Number(b.total_hours) - Number(a.total_hours))
    .slice(0, 3)
  const maxPhaseHours = Math.max(...phaseTotals.map((phase) => phase.hours), 0)

  return (
    <>
      <section className="page-heading dashboard-heading">
        <p className="eyebrow">PROJECT OVERVIEW</p>
        <h1>{project.name}</h1>
        <p>{project.description || 'Project overview and current activity.'}</p>
      </section>

      {error && (
        <Card className="dashboard-error" role="alert">
          <p>{error}</p>
          <Button variant="secondary" type="button" onClick={() => setReloadCount((value) => value + 1)}>Try again</Button>
        </Card>
      )}

      <section className="dashboard-summary-grid" aria-label="Project summary">
        <Card className="dashboard-stat-card">
          <span>Total hours</span>
          <strong>{metricsPending ? '—' : formatHours(totalHours)}</strong>
          <small>Logged across all phases</small>
        </Card>
        <Card className="dashboard-stat-card">
          <span>Requirements</span>
          <strong>{metricsPending ? '—' : data.requirements.length}</strong>
          <small>{metricsPending ? 'Loading project data' : `${functionalRequirements} functional · ${nonFunctionalRequirements} non-functional`}</small>
        </Card>
        <Card className="dashboard-stat-card">
          <span>Active team</span>
          <strong>{metricsPending ? '—' : activeMembers.length}</strong>
          <small>{metricsPending ? 'Loading project data' : `${data.memberHours.length} members with recorded hours`}</small>
        </Card>
        <Card className="dashboard-stat-card">
          <span>Open risks</span>
          <strong>{metricsPending ? '—' : openRisks}</strong>
          <small>{metricsPending ? 'Loading project data' : `${activeRisks.length} active risks total`}</small>
        </Card>
      </section>

      {loading ? (
        <Card className="dashboard-message" aria-live="polite">Loading project activity...</Card>
      ) : !error && (
        <section className="dashboard-content-grid">
          <Card className="dashboard-panel dashboard-phase-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Effort by phase</h2>
                <p>{formatHours(totalHours)} total hours logged</p>
              </div>
              <Button variant="quiet" type="button" onClick={() => onNavigate('reports')}>View reports</Button>
            </div>
            <div className="dashboard-phase-list">
              {phaseTotals.map((phase) => (
                <div className="dashboard-phase-row" key={phase.name}>
                  <div className="dashboard-phase-label">
                    <span>{phase.name}</span>
                    <strong>{formatHours(phase.hours)} hrs</strong>
                  </div>
                  <div className="dashboard-phase-track" aria-hidden="true">
                    <span style={{ width: `${maxPhaseHours ? (phase.hours / maxPhaseHours) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Project details</h2>
                <p>Selected project information</p>
              </div>
            </div>
            <dl className="dashboard-details-list">
              <div><dt>Owner</dt><dd>{project.owner_name || 'Not set'}</dd></div>
              <div><dt>Requirements</dt><dd>{data.requirements.length}</dd></div>
              <div><dt>Team members</dt><dd>{activeMembers.length} active</dd></div>
              <div><dt>Risks</dt><dd>{activeRisks.length} active</dd></div>
            </dl>
            <div className="dashboard-quick-links">
              <Button variant="secondary" type="button" onClick={() => onNavigate('requirements')}>Requirements</Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate('risks')}>Risks</Button>
            </div>
          </Card>

          <Card className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Highest exposure risks</h2>
                <p>Ranked by probability × impact</p>
              </div>
              <Button variant="quiet" type="button" onClick={() => onNavigate('risks')}>View risks</Button>
            </div>
            {topRisks.length ? (
              <ul className="dashboard-risk-list">
                {topRisks.map((risk) => (
                  <li key={risk.risk_id}>
                    <span>{risk.name}</span>
                    <strong>{risk.exposure}</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="dashboard-empty-note">No active risks have been added.</p>}
          </Card>

          <Card className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Team effort</h2>
                <p>Hours recorded by member</p>
              </div>
              <Button variant="quiet" type="button" onClick={() => onNavigate('team')}>View team</Button>
            </div>
            {topMembers.length ? (
              <ul className="dashboard-member-list">
                {topMembers.map((member) => (
                  <li key={member.member_id}>
                    <span>{member.name}</span>
                    <strong>{formatHours(member.total_hours)} hrs</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="dashboard-empty-note">No team effort has been recorded yet.</p>}
          </Card>
        </section>
      )}
    </>
  )
}

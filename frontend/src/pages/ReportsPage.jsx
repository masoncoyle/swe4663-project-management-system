import { useEffect, useState } from 'react'
import { Button, Card, DataTable } from '../components/UI.jsx'

const phases = [
  { value: 'Requirements Analysis', label: 'Requirements analysis' },
  { value: 'Design', label: 'Design' },
  { value: 'Coding', label: 'Coding' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Project Management', label: 'Project management' },
]

const phaseColors = ['#75afa6', '#527da5', '#e8b66d', '#90a9bd', '#202b3c']
const emptyData = { requirementRows: [], phaseTotals: [], memberHours: [], estimates: [] }

function formatHours(hours) {
  const value = Number(hours ?? 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function mapRequirementRows(rows) {
  const requirements = new Map()

  rows.forEach((row) => {
    if (!requirements.has(row.requirement_id)) {
      requirements.set(row.requirement_id, {
        requirement_id: row.requirement_id,
        name: row.name,
        ...Object.fromEntries(phases.map((phase) => [phase.value, 0])),
      })
    }
    if (row.phase && phases.some((phase) => phase.value === row.phase)) {
      const requirement = requirements.get(row.requirement_id)
      requirement[row.phase] += Number(row.total_hours ?? 0)
    }
  })

  return [...requirements.values()].map((requirement) => ({
    ...requirement,
    total: phases.reduce((total, phase) => total + requirement[phase.value], 0),
  }))
}

export default function ReportsPage({ project }) {
  const [search, setSearch] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [snapshot, setSnapshot] = useState({ projectId: null, version: -1, data: emptyData, error: '' })
  const projectId = project?.project_id
  const data = snapshot.projectId === projectId ? snapshot.data : emptyData
  const loading = Boolean(projectId) && (snapshot.projectId !== projectId || snapshot.version !== reloadCount)
  const error = snapshot.projectId === projectId && snapshot.version === reloadCount ? snapshot.error : ''

  // Load saved report totals for the selected project
  useEffect(() => {
    if (!projectId) return undefined
    const controller = new AbortController()
    const query = `project_id=${encodeURIComponent(projectId)}`

    Promise.all([
      fetch(`/api/reports/hours-by-requirement?${query}`, { signal: controller.signal }),
      fetch(`/api/reports/hours-by-phase?${query}`, { signal: controller.signal }),
      fetch(`/api/reports/hours-by-member?${query}`, { signal: controller.signal }),
      fetch(`/api/reports/estimate-vs-actual?${query}`, { signal: controller.signal }),
    ])
      .then(async (responses) => {
        if (responses.some((response) => !response.ok)) throw new Error('Could not load reports')
        return Promise.all(responses.map((response) => response.json()))
      })
      .then(([requirementData, phaseData, memberHours, estimates]) => {
        const phaseTotals = phases.map((phase) => ({
          ...phase,
          hours: Number(phaseData.find((row) => row.phase === phase.value)?.total_hours ?? 0),
        }))
        setSnapshot({
          projectId,
          version: reloadCount,
          data: { requirementRows: mapRequirementRows(requirementData), phaseTotals, memberHours, estimates },
          error: '',
        })
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setSnapshot({
            projectId,
            version: reloadCount,
            data: emptyData,
            error: 'Could not load reports. Check that the server is running, then try again.',
          })
        }
      })

    return () => controller.abort()
  }, [projectId, reloadCount])

  const visibleRows = data.requirementRows.filter((requirement) => (
    `${requirement.requirement_id} ${requirement.name}`.toLowerCase().includes(search.trim().toLowerCase())
  ))
  const phaseTotals = phases.map((phase) => ({
    ...phase,
    hours: Number(data.phaseTotals.find((item) => item.value === phase.value)?.hours ?? 0),
  }))
  const memberRows = [...data.memberHours].sort((a, b) => Number(b.total_hours) - Number(a.total_hours))
  const totalProjectHours = phaseTotals.reduce((total, item) => total + item.hours, 0)
  let chartProgress = 0
  const chartSegments = phaseTotals.map(({ hours }, index) => {
    const start = chartProgress
    chartProgress += totalProjectHours ? (hours / totalProjectHours) * 100 : 0
    return `${phaseColors[index]} ${start}% ${chartProgress}%`
  }).join(', ')

  const columns = [
    { key: 'requirement_id', label: 'Requirement ID', render: (item) => `REQ-${String(item.requirement_id).padStart(3, '0')}` },
    { key: 'name', label: 'Requirement' },
    ...phases.map((phase) => ({
      key: phase.value,
      label: phase.label,
      render: (item) => formatHours(item[phase.value]),
    })),
    { key: 'total', label: 'Total hours', render: (item) => formatHours(item.total) },
  ]
  const memberColumns = [
    { key: 'name', label: 'Team member' },
    { key: 'active_status', label: 'Roster status', render: (member) => member.active_status === 'active' ? 'Active' : 'Inactive' },
    { key: 'total_hours', label: 'Hours', render: (member) => formatHours(member.total_hours) },
  ]
  const estimateColumns = [
    { key: 'name', label: 'Requirement' },
    { key: 'estimate', label: 'Estimated hours', render: (item) => item.estimate === null ? 'Not set' : formatHours(item.estimate) },
    { key: 'actual_hours', label: 'Actual hours', render: (item) => formatHours(item.actual_hours) },
    { key: 'exceeds_estimate', label: 'Estimate check', render: (item) => item.estimate === null ? 'No estimate' : item.exceeds_estimate ? 'Over estimate' : 'Within estimate' },
  ]

  return (
    <>
      <section className="page-heading">
        <h1>Reports</h1>
        <p>{project ? `Effort by requirement and development phase for ${project.name}.` : 'Choose a project to view its effort reports.'}</p>
      </section>

      {project ? (
        <>
          {error && (
            <Card className="dashboard-error" role="alert">
              <p>{error}</p>
              <Button variant="secondary" type="button" onClick={() => setReloadCount((count) => count + 1)}>Try again</Button>
            </Card>
          )}
          <section className="report-summary-grid" aria-label="Project hours by phase">
            <Card className="report-summary-card">
              <span>Total project hours</span>
              <strong>{loading || error ? '—' : formatHours(totalProjectHours)}</strong>
            </Card>
            {phaseTotals.map(({ value, label, hours }) => (
              <Card className="report-summary-card" key={value}>
                <span>{label}</span>
                <strong>{loading || error ? '—' : formatHours(hours)}</strong>
              </Card>
            ))}
          </section>

          {loading ? (
            <Card className="dashboard-message" aria-live="polite">Loading project reports...</Card>
          ) : !error && (
            <>
              <Card className="report-chart-card">
                <div className="report-chart-heading">
                  <h2>Hours by phase</h2>
                  <p>How logged effort is split across the five phases.</p>
                </div>
                <div className="report-chart-content">
                  <div
                    className="report-donut"
                    role="img"
                    aria-label={`Effort by phase, ${formatHours(totalProjectHours)} total hours`}
                    style={{ background: totalProjectHours ? `conic-gradient(${chartSegments})` : 'var(--border)' }}
                  >
                    <div className="report-donut__center">
                      <strong>{formatHours(totalProjectHours)}</strong>
                      <span>hours</span>
                    </div>
                  </div>
                  <ul className="report-chart-legend" aria-label="Hours per phase">
                    {phaseTotals.map(({ value, label, hours }, index) => (
                      <li key={value}>
                        <span className="report-chart-legend__label">
                          <i style={{ backgroundColor: phaseColors[index] }} />
                          {label}
                        </span>
                        <strong>{formatHours(hours)} hrs</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="report-table-card">
                <div className="report-table-heading">
                  <div>
                    <h2>Hours by requirement</h2>
                    <p>Each row shows hours across the five development phases.</p>
                  </div>
                  <label className="search-field report-search">
                    <span className="visually-hidden">Search requirements</span>
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requirements" />
                  </label>
                </div>
                <DataTable
                  columns={columns}
                  rows={visibleRows}
                  rowKey={(item) => item.requirement_id}
                  emptyMessage={data.requirementRows.length ? 'No matching requirements.' : 'No requirements have been added to this project.'}
                />
              </Card>

              <Card className="report-table-card">
                <div className="report-table-heading">
                  <div>
                    <h2>Hours by team member</h2>
                    <p>Recorded effort for each member on this project.</p>
                  </div>
                </div>
                <DataTable
                  columns={memberColumns}
                  rows={memberRows}
                  rowKey={(member) => member.member_id}
                  emptyMessage="No team members have been added to this project."
                />
              </Card>

              <Card className="report-table-card">
                <div className="report-table-heading">
                  <div>
                    <h2>Estimate vs actual</h2>
                    <p>Requirements that have an estimate are checked against logged hours.</p>
                  </div>
                </div>
                <DataTable
                  columns={estimateColumns}
                  rows={data.estimates}
                  rowKey={(item) => item.requirement_id}
                  emptyMessage="No requirements have been added to this project."
                />
              </Card>
            </>
          )}
        </>
      ) : (
        <Card className="empty-requirements"><p>Select a project before viewing reports.</p></Card>
      )}
    </>
  )
}

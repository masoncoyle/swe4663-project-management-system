import { useState } from 'react'
import { Card, DataTable } from '../components/UI.jsx'

const phases = [
  'Requirements analysis',
  'Design',
  'Coding',
  'Testing',
  'Project management',
]

const phaseColors = ['#75afa6', '#527da5', '#e8b66d', '#90a9bd', '#202b3c']

function formatHours(hours) {
  const value = Number(hours ?? 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export default function ReportsPage({ project }) {
  const [search, setSearch] = useState('')
  const requirements = project?.requirements ?? []
  const effortEntries = project?.effortEntries ?? []

  // Summarize logged effort by requirement and development phase
  const reportRows = requirements.map((requirement) => {
    const requirementEntries = effortEntries.filter((entry) => entry.requirementId === requirement.id)
    const phaseHours = Object.fromEntries(phases.map((phase) => [
      phase,
      requirementEntries
        .filter((entry) => entry.phase === phase)
        .reduce((total, entry) => total + Number(entry.hours || 0), 0),
    ]))

    return {
      ...requirement,
      ...phaseHours,
      total: Object.values(phaseHours).reduce((total, hours) => total + hours, 0),
    }
  })

  const visibleRows = reportRows.filter((requirement) => (
    `${requirement.id} ${requirement.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ))
  const phaseTotals = phases.map((phase) => ({
    phase,
    hours: effortEntries
      .filter((entry) => entry.phase === phase)
      .reduce((total, entry) => total + Number(entry.hours || 0), 0),
  }))
  const totalProjectHours = phaseTotals.reduce((total, item) => total + item.hours, 0)
  let chartProgress = 0
  const chartSegments = phaseTotals.map(({ hours }, index) => {
    const start = chartProgress
    chartProgress += totalProjectHours ? (hours / totalProjectHours) * 100 : 0
    return `${phaseColors[index]} ${start}% ${chartProgress}%`
  }).join(', ')

  const columns = [
    { key: 'id', label: 'Requirement ID' },
    { key: 'description', label: 'Requirement' },
    ...phases.map((phase) => ({
      key: phase,
      label: phase,
      render: (requirement) => formatHours(requirement[phase]),
    })),
    { key: 'total', label: 'Total hours', render: (requirement) => formatHours(requirement.total) },
  ]

  return (
    <>
      <section className="page-heading">
        <h1>Reports</h1>
        <p>
          {project
            ? `Effort by requirement and development phase for ${project.name}.`
            : 'Choose a project to view its effort reports.'}
        </p>
      </section>

      {project ? (
        <>
          <section className="report-summary-grid" aria-label="Project hours by phase">
            <Card className="report-summary-card report-summary-card--total">
              <span>Total project hours</span>
              <strong>{formatHours(totalProjectHours)}</strong>
            </Card>
            {phaseTotals.map(({ phase, hours }) => (
              <Card className="report-summary-card" key={phase}>
                <span>{phase}</span>
                <strong>{formatHours(hours)}</strong>
              </Card>
            ))}
          </section>

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
                {phaseTotals.map(({ phase, hours }, index) => (
                  <li key={phase}>
                    <span className="report-chart-legend__label">
                      <i style={{ backgroundColor: phaseColors[index] }} />
                      {phase}
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
              rows={visibleRows}
              rowKey={(requirement) => requirement.id}
              emptyMessage={requirements.length ? 'No matching requirements.' : 'No requirements have been added to this project.'}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-requirements">
          <p>Select a project before viewing reports.</p>
        </Card>
      )}
    </>
  )
}

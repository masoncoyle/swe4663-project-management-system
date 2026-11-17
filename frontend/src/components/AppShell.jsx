const navigation = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'effort', label: 'Effort & Hours' },
  { id: 'risks', label: 'Risks' },
  { id: 'reports', label: 'Reports' },
]

export default function AppShell({ activePage, onNavigate, pageTitle, project, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => onNavigate('projects')}>
          <span className="brand-mark">PMS</span>
          <span>Project Management System</span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activePage === item.id ? 'is-active' : ''}`}
                onClick={() => onNavigate(item.id)}
                aria-current={activePage === item.id ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-project">
          <small>SELECTED PROJECT</small>
          <strong>{project?.name ?? 'Choose a project'}</strong>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <strong>{pageTitle}</strong>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}

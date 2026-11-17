import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PlannedPage from './pages/PlannedPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import { sampleProjects } from './data/sampleData.js'
import './App.css'

const pageTitles = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  team: 'Team',
  requirements: 'Requirements',
  effort: 'Effort & Hours',
  risks: 'Risks',
  reports: 'Reports',
}

function App() {
  const [activePage, setActivePage] = useState('projects')
  const [selectedProjectId, setSelectedProjectId] = useState(sampleProjects[0].id)
  const selectedProject = sampleProjects.find((project) => project.id === selectedProjectId)

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      pageTitle={pageTitles[activePage]}
      project={selectedProject}
    >
      {activePage === 'projects' && (
        <ProjectsPage
          projects={sampleProjects}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId)
            setActivePage('dashboard')
          }}
        />
      )}
      {activePage === 'dashboard' && selectedProject && (
        <DashboardPage project={selectedProject} onNavigate={setActivePage} />
      )}
      {!['projects', 'dashboard'].includes(activePage) && (
        <PlannedPage page={activePage} onNavigate={setActivePage} />
      )}
    </AppShell>
  )
}

export default App

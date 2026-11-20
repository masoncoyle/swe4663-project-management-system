import { useEffect, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PlannedPage from './pages/PlannedPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import TeamPage from './pages/TeamPage.jsx'
import EffortHours from './pages/EffortHours.jsx'
import RequirementsPage from './pages/RequirementsPage.jsx'
import RisksPage from './pages/RisksPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
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
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const selectedProject = projects.find((project) => project.project_id === selectedProjectId)

  async function loadProject(){
    const response = await fetch('/api/projects')
    if (!response.ok) {
      console.error('Error loading projects.')
      return
    }
    const loadedProjects = await response.json()
    setProjects(loadedProjects)
  }
  useEffect(() => {
    let isMounted = true

    fetch('/api/projects')
      .then((response) => {
        if (!response.ok) throw new Error('Error loading projects.')
        return response.json()
      })
      .then((loadedProjects) => {
        if (isMounted) setProjects(loadedProjects)
      })
      .catch((error) => {
        if (isMounted) console.error(error.message)
      })

    return () => { isMounted = false }
  }, [])

  async function createProject(projectDetails) {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(projectDetails)
    })
    if (!response.ok) {
      console.error('Error creating project.')
      return
    }
    await loadProject()
  }

  async function updateProject(updatedProject) {
    const response = await fetch(`/api/projects/${updatedProject.project_id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(updatedProject)
    })
    if (!response.ok) {
      console.error('Error updating project.')
      return
    }
    await loadProject()
  }

 async function deleteProject(projectId) {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      console.error('Error deleting project.')
      return
    }
    await loadProject()
    if (selectedProjectId === projectId) {
      setSelectedProjectId('')
    }
  }

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      pageTitle={pageTitles[activePage]}
      project={selectedProject}
    >
      {activePage === 'projects' && (
        <ProjectsPage
          projects={projects}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId)
            setActivePage('dashboard')
          }}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
        />
      )}
      {activePage === 'dashboard' && (
        <DashboardPage project={selectedProject} onNavigate={setActivePage} />
      )}
      {activePage === 'team' && (
        <TeamPage project={selectedProject} />
      )}
      {activePage === 'effort' && (
         <EffortHours project={selectedProject} />
      )}
      {activePage === 'requirements' && (
        <RequirementsPage project={selectedProject} />
      )}
      {activePage === 'risks' && (
        <RisksPage project={selectedProject} />
      )}
      {activePage === 'reports' && (
        <ReportsPage project={selectedProject} />
      )}
      {!['projects', 'dashboard', 'requirements', 'risks', 'reports', 'team', 'effort'].includes(activePage) && (
        <PlannedPage page={activePage} onNavigate={setActivePage} />
      )}
    </AppShell>
  )
}

export default App

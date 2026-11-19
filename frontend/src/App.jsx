import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PlannedPage from './pages/PlannedPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import RequirementsPage from './pages/RequirementsPage.jsx'
import RisksPage from './pages/RisksPage.jsx'
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
  // Keep project changes in the UI until the API is connected
  const [projects, setProjects] = useState(sampleProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(sampleProjects[0].id)
  const selectedProject = projects.find((project) => project.id === selectedProjectId)

  function createProject(projectDetails) {
    // New projects start with no tracked work
    const project = {
      id: `project-${Date.now()}`,
      ...projectDetails,
      status: 'Planning',
      progress: 0,
      hours: 0,
      phases: [],
      requirements: [],
      risks: [],
    }
    setProjects((currentProjects) => [...currentProjects, project])
  }

  function updateProject(updatedProject) {
    setProjects((currentProjects) => currentProjects.map((project) => (
      project.id === updatedProject.id ? { ...project, ...updatedProject } : project
    )))
  }

  function deleteProject(projectId) {
    const remainingProjects = projects.filter((project) => project.id !== projectId)
    setProjects(remainingProjects)
    if (selectedProjectId === projectId) {
      setSelectedProjectId(remainingProjects[0]?.id ?? '')
    }
  }

  // Keep requirement edits attached to the selected project
  function updateRequirements(requirements) {
    setProjects((currentProjects) => currentProjects.map((project) => (
      project.id === selectedProjectId ? { ...project, requirements } : project
    )))
  }

  // Keep risk records attached to the selected project
  function updateRisks(risks) {
    setProjects((currentProjects) => currentProjects.map((project) => (
      project.id === selectedProjectId ? { ...project, risks } : project
    )))
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
      {activePage === 'dashboard' && selectedProject && (
        <DashboardPage project={selectedProject} onNavigate={setActivePage} />
      )}
      {activePage === 'requirements' && (
        <RequirementsPage project={selectedProject} onUpdateRequirements={updateRequirements} />
      )}
      {activePage === 'risks' && (
        <RisksPage project={selectedProject} onUpdateRisks={updateRisks} />
      )}
      {!['projects', 'dashboard', 'requirements', 'risks'].includes(activePage) && (
        <PlannedPage page={activePage} onNavigate={setActivePage} />
      )}
    </AppShell>
  )
}

export default App

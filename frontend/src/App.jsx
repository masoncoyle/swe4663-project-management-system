import { useEffect, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PlannedPage from './pages/PlannedPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import TeamPage from './pages/TeamPage.jsx'
import EffortHours from './pages/EffortHours.jsx'
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
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const selectedProject = projects.find((project) => project.id === selectedProjectId)

  async function loadProject(){
    const response = await fetch("/api/projects")
    if (!response.ok) {
      console.error('Error loading projects.')
      return
    }
    const loadedProjects = await response.json()
    setProjects(loadedProjects)
  }
  useEffect(() => { loadProject() }, [])

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
      {activePage === 'team' && selectedProject && (
        <TeamPage project={selectedProject} />
      )}
      {activePage === 'effort' && selectedProject && (
         <EffortHours project={selectedProject} />
      )}
      {activePage === 'requirements' && (
        <RequirementsPage project={selectedProject} onUpdateRequirements={updateRequirements} />
      )}
      {activePage === 'risks' && (
        <RisksPage project={selectedProject} onUpdateRisks={updateRisks} />
      )}
      {!['projects', 'dashboard', 'requirements','team', 'effort', 'risks'].includes(activePage) && (
        <PlannedPage page={activePage} onNavigate={setActivePage} />
      )}
    </AppShell>
  )
}

export default App

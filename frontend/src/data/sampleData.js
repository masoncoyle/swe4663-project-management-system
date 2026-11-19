// Sample project data for the frontend prototype.
export const sampleProjects = [
  {
    id: 'client-portal',
    name: 'Website Redesign',
    description: 'Update the layout and content of a small business website.',
    owner: 'John Doe',
    status: 'In progress',
    dueDate: 'Nov 30, 2026',
    progress: 35,
    hours: 24,
    phases: [
      { name: 'Requirements analysis', hours: 7 },
      { name: 'Design', hours: 4 },
      { name: 'Coding', hours: 8 },
      { name: 'Testing', hours: 2 },
      { name: 'Project management', hours: 3 },
    ],
    requirements: [
      { id: 'REQ-01', description: 'Users can create, view, edit, and delete project records.', type: 'Functional', priority: 'High' },
      { id: 'REQ-02', description: 'Users can classify requirements as functional or non-functional.', type: 'Functional', priority: 'High' },
      { id: 'REQ-03', description: 'Users can log hours for a requirement across the five development phases.', type: 'Functional', priority: 'High' },
      { id: 'REQ-04', description: 'The interface remains readable on desktop and mobile screens.', type: 'Non-functional', priority: 'Medium' },
    ],
  },
  {
    id: 'inventory-forecast',
    name: 'Mobile App',
    description: 'Plan and build a simple mobile application.',
    owner: 'John Doe 2',
    status: 'Planning',
    dueDate: 'Dec 18, 2026',
    progress: 0,
    hours: 0,
    phases: [],
    requirements: [],
  },
]

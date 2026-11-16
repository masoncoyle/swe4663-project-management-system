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
  },
]

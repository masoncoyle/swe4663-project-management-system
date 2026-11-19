import { Card, DataTable } from '../components/UI.jsx'

const columns = [
    { key: 'name', label: 'Development Effort' },
    { key: 'hours', label: 'Hours' },
    

]

export default function EffortHours({ project }) {
    const phases = project?.phases ?? []

    const totalHours = phases.reduce((sum, phase) => sum + phase.hours || 0, 0)

    const rows = phases.map((phase) => ({
        name: phase.name,
        hours: phase.hours,
        share: totalHours > 0 ? (Math.round(phase.hours / totalHours) * 100).toFixed(1) + '%' : '0%',
    }))


    return (
        <>
            <section className="page-heading">
                <p className="eyebrow">Effort Hours</p>
                <h1>Effort & Hours</h1>
                <p>Hours logged for each development phase.</p>
            </section>

            <Card className="effort-card">
                <div className="card-heading">
                    <h2> Total Hours: {totalHours.toFixed(1)}</h2>
                </div>
                <DataTable columns={columns} rows={rows} rowKey={(phase) => phase.name} emptyMessage="No hours have been logged." />


            </Card>
            
        </>

    )


}

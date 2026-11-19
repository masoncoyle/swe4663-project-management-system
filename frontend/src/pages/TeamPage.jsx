import {Card, DataTable,Button } from '../components/UI.jsx'
import { useState } from 'react'

const PlaceHolderTeamMembers = [
    { id: 1, name: 'John Doe', job: "Software Engineer" },
    { id: 2, name: 'Jane Smith', job: "Product Manager" },
    { id: 3, name: 'Josh Malcome', job: "Backend Developer" },
    {id: 4, name: 'Barry Allen', job: "Frontend Developer" }, { }
]

export default function TeamPage({ project }) {

    const [members, setMembers] = useState(PlaceHolderTeamMembers)
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberJob, setNewMemberJob] = useState('')


    function handleAddMember() {
        event.preventDefault()
        const name = newMemberName.trim()
        const job = newMemberJob.trim()

        if (!name || !job) return


        const newMember = Math.max(0, ...members.map((member) => member.id)) + 1

        setMembers([...members, {id:newMember, name, job}])
        setNewMemberName('')
        setNewMemberJob('')

    }

    function handleRemoveMember(memberId) {
        setMembers(members.filter((member) => member.id !== memberId))
    }
    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'job', label: 'Job' },
        {
            key: 'actions',
            label: ' ',
            render: (member) => (
                <Button variant="danger" onClick={() => handleRemoveMember(member.id)}>
                    Remove
                </Button>
            )
        }
    ]

    return (
        <>
            <section className="page-heading">
                <p className="eyebrow">TEAM MANAGEMENT</p>
                <h1>Team Members</h1>
                <p>Employees working on {project.name}</p>
            </section>

            <Card>
                <form className="add-member-form" onSubmit={handleAddMember}>
                    <input
                        type="text"
                        placeholder="Member Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                    />
                    <input
                        className = "text -input"
                        type="text"
                        placeholder="Member Job"
                        value={newMemberJob}
                        onChange={(e) => setNewMemberJob(e.target.value)}
                    />
                    <Button type="submit">Add Member</Button>
                </form>

                <DataTable
                    columns={columns}
                    rows={members}
                    rowKey={(member) => member.id}
                    emptyMessage="No team members have been added yet."
                />
            </Card>
        </>

    )
}
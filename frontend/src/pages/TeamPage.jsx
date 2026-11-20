import { Card, DataTable, Button } from "../components/UI.jsx";
import { useState, useEffect } from "react";

export default function TeamPage({ project }) {
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");

  async function loadMembers(){
    if (!project) {
      return
    }
    const response = await fetch(`/api/members?project_id=${project.project_id}`)
    if (!response.ok) {
      console.error('Error loading members.')
      return
    }
    const loadedMembers = await response.json()
    setMembers(loadedMembers)
  }
  useEffect(() => { loadMembers() }, [project?.project_id])

  async function handleAddMember(event) {
    event.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({project_id: project.project_id, name})
    })
    if (!response.ok) {
      console.error('Error adding new member.')
      return
    }
    await loadMembers()
    setNewMemberName("")
   }
  
  async function handleMemberStatus(member) {
    const newStatus = member.active_status == 'active' ? 'inactive' : 'active'
    const response = await fetch(`/api/members/${member.member_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            name : member.name,
            active_status : newStatus
        })
    })
    if (!response.ok) {
      console.error('Error changing status.')
      return
    }
    await loadMembers()
  }

  const columns = [
        { key: 'member_id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'active_status', label: 'Status' },
        {
            key: 'actions',
            label: ' ',
            render: (member) => (
                <Button onClick={() => handleMemberStatus(member)}>
                    {member.active_status == 'active' ? 'Deactivate' : 'Activate'}
                </Button>
            ),
        }
    ]

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">TEAM MANAGEMENT</p>
        <h1>Team Members</h1>
        <p>Employees working on {project?.name}</p>
      </section>

      <Card>
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="text"
            placeholder="Member Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
          />
          <Button type="submit">Add Member</Button>
        </form>

        <DataTable
          columns={columns}
          rows={members}
          rowKey={(member) => member.member_id}
          emptyMessage="No team members have been added yet."
        />
      </Card>
    </>
  );
}

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLists, createList, deleteList, getContacts, importCSV } from '../api/contacts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Plus, Upload, Trash2, Users, ChevronRight } from 'lucide-react'

const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
    padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
}

export default function Contacts() {
    const qc = useQueryClient()
    const { data, isLoading } = useQuery({ queryKey: ['lists'], queryFn: getLists })
    const lists = data?.data?.lists || []

    const [selectedList, setSelectedList] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)
    const [importing, setImporting] = useState(false)

    const { data: contactsData, isLoading: loadingContacts } = useQuery({
        queryKey: ['contacts', selectedList?.id],
        queryFn: () => getContacts(selectedList.id),
        enabled: !!selectedList,
    })
    const contacts = contactsData?.data?.contacts || []

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return
        setCreating(true)
        try {
            await createList({ name: newName })
            toast.success('List created')
            setNewName(''); setShowCreate(false)
            qc.invalidateQueries(['lists'])
        } catch { toast.error('Failed to create list') }
        finally { setCreating(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this list and all its contacts?')) return
        try {
            await deleteList(id)
            toast.success('List deleted')
            if (selectedList?.id === id) setSelectedList(null)
            qc.invalidateQueries(['lists'])
        } catch { toast.error('Failed to delete') }
    }

    const handleImport = async (listId, e) => {
        const file = e.target.files[0]
        if (!file) return
        setImporting(true)
        try {
            const res = await importCSV(listId, file)
            toast.success(res.data.message)
            qc.invalidateQueries(['lists'])
            qc.invalidateQueries(['contacts', listId])
        } catch (err) {
            toast.error(err.response?.data?.message || 'Import failed')
        } finally { setImporting(false); e.target.value = '' }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Contacts</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{lists.length} lists</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New List</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedList ? '300px 1fr' : '1fr', gap: '1rem' }}>
                {/* Lists panel */}
                <Card padding="0">
                    {isLoading ? (
                        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                    ) : lists.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                            No lists yet. Create one to get started.
                        </div>
                    ) : lists.map(list => (
                        <div key={list.id}
                            onClick={() => setSelectedList(list)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.15s',
                                background: selectedList?.id === list.id ? 'var(--accent-dim)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (selectedList?.id !== list.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                            onMouseLeave={e => { if (selectedList?.id !== list.id) e.currentTarget.style.background = 'transparent' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={15} color="var(--text-secondary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{list.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{list.contact_count?.toLocaleString()} contacts</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(list.id) }}
                                    style={{ background: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4 }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                ><Trash2 size={14} /></button>
                                <ChevronRight size={14} color="var(--text-muted)" />
                            </div>
                        </div>
                    ))}
                </Card>

                {/* Contacts panel */}
                {selectedList && (
                    <Card padding="0">
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selectedList.name}</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedList.contact_count?.toLocaleString()} contacts</p>
                            </div>
                            <label style={{ cursor: 'pointer' }}>
                                <Button size="sm" variant="secondary" loading={importing} onClick={() => { }}>
                                    <Upload size={13} /> Import CSV
                                </Button>
                                <input type="file" accept=".csv" style={{ display: 'none' }}
                                    onChange={(e) => handleImport(selectedList.id, e)} />
                            </label>
                        </div>
                        {loadingContacts ? (
                            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                        ) : contacts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                                No contacts yet. Import a CSV file to add contacts.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        {['Phone', 'First Name', 'Last Name', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.phone_number}</td>
                                            <td style={{ padding: '11px 16px', fontSize: 14 }}>{c.first_name || '—'}</td>
                                            <td style={{ padding: '11px 16px', fontSize: 14 }}>{c.last_name || '—'}</td>
                                            <td style={{ padding: '11px 16px', fontSize: 12, color: c.status === 'active' ? 'var(--accent)' : 'var(--text-muted)' }}>{c.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                )}
            </div>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Contact List">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>List name</label>
                        <input required autoFocus style={inputStyle} placeholder="e.g. VIP Customers"
                            value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" loading={creating}>Create List</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
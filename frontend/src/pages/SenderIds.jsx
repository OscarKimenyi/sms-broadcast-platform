import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSenderIds, createSenderId, deleteSenderId } from '../api/senderIds'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Plus, Trash2, Hash } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }
const statusVariant = { pending: 'warning', approved: 'success', rejected: 'danger' }

export default function SenderIds() {
    const qc = useQueryClient()
    const { data, isLoading } = useQuery({ queryKey: ['senderIds'], queryFn: getSenderIds })
    const senderIds = data?.data?.sender_ids || []
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ sender_name: '', description: '' })
    const [creating, setCreating] = useState(false)

    const handleCreate = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            await createSenderId(form)
            toast.success('Sender ID submitted for approval')
            setShowCreate(false); setForm({ sender_name: '', description: '' })
            qc.invalidateQueries(['senderIds'])
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed')
        } finally { setCreating(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this sender ID?')) return
        await deleteSenderId(id)
        toast.success('Deleted'); qc.invalidateQueries(['senderIds'])
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Sender IDs</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Custom names that appear on your SMS instead of a number</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Register Sender ID</Button>
            </div>

            <Card style={{ background: 'var(--warning-dim)', border: '1px solid var(--warning)33' }}>
                <p style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.6 }}>
                    <strong>Note:</strong> Sender IDs must be approved by Africa's Talking before use. This typically takes 1–3 business days. Maximum 11 characters, letters and numbers only.
                </p>
            </Card>

            <Card padding="0">
                {isLoading ? (
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                ) : senderIds.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Hash size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                        <p>No sender IDs yet. Register one to brand your SMS.</p>
                    </div>
                ) : senderIds.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < senderIds.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{s.sender_name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.description || 'No description'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Submitted {new Date(s.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></Button>
                        </div>
                    </div>
                ))}
            </Card>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Sender ID">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Sender name <span style={{ color: 'var(--text-muted)' }}>(max 11 chars)</span></label>
                        <input required maxLength={11} style={inputStyle} placeholder="e.g. SHOPWANZA"
                            value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Purpose / description</label>
                        <input style={inputStyle} placeholder="e.g. Marketing campaigns for our shop"
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" loading={creating}>Submit</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
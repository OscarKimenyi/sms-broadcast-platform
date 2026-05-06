import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/templates'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }

export default function Templates() {
    const qc = useQueryClient()
    const { data, isLoading } = useQuery({ queryKey: ['templates'], queryFn: getTemplates })
    const templates = data?.data?.templates || []
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', body: '' })
    const [saving, setSaving] = useState(false)

    const openCreate = () => { setEditing(null); setForm({ name: '', body: '' }); setShowModal(true) }
    const openEdit = (t) => { setEditing(t); setForm({ name: t.name, body: t.body }); setShowModal(true) }

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            if (editing) {
                await updateTemplate(editing.id, form)
                toast.success('Template updated')
            } else {
                await createTemplate(form)
                toast.success('Template created')
            }
            setShowModal(false); qc.invalidateQueries(['templates'])
        } catch { toast.error('Failed to save') }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return
        await deleteTemplate(id); toast.success('Deleted')
        qc.invalidateQueries(['templates'])
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Templates</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Reusable message templates for your campaigns</p>
                </div>
                <Button onClick={openCreate}><Plus size={15} /> New Template</Button>
            </div>

            <Card style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)33' }}>
                <p style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.6 }}>
                    Use merge tags in your templates:{' '}
                    <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{'{{first_name}}'}</code>{' '}
                    <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{'{{last_name}}'}</code>{' '}
                    <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{'{{phone}}'}</code>
                </p>
            </Card>

            {isLoading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}><Spinner /></div>
                : templates.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <FileText size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                            <p>No templates yet. Create one to speed up campaign creation.</p>
                        </div>
                    </Card>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {templates.map(t => (
                            <Card key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Button size="sm" variant="secondary" onClick={() => openEdit(t)}><Pencil size={13} /></Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}><Trash2 size={13} /></Button>
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{t.body}</p>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.body.length} characters · Updated {new Date(t.updated_at).toLocaleDateString()}</div>
                            </Card>
                        ))}
                    </div>
                )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Template' : 'New Template'}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Template name</label>
                        <input required style={inputStyle} placeholder="e.g. Payment Reminder"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Message body</label>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.body.length}/160</span>
                        </div>
                        <textarea required maxLength={160} rows={4} style={{ ...inputStyle, resize: 'vertical' }}
                            placeholder={'Hi {{first_name}}, your payment is due...'}
                            value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createCampaign } from '../api/campaigns'
import { getLists } from '../api/contacts'
import { getTemplates } from '../api/templates'
import { getSenderIds } from '../api/senderIds'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'
import { FileText } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }
const label = { fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }

export default function NewCampaign() {
    const navigate = useNavigate()
    const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: getLists })
    const { data: templatesData } = useQuery({ queryKey: ['templates'], queryFn: getTemplates })
    const { data: senderData } = useQuery({ queryKey: ['senderIds'], queryFn: getSenderIds })

    const lists = listsData?.data?.lists || []
    const templates = templatesData?.data?.templates || []
    const senderIds = (senderData?.data?.sender_ids || []).filter(s => s.status === 'approved')

    const [form, setForm] = useState({ name: '', list_id: '', sender_id: '', message_body: '', scheduled_at: '' })
    const [loading, setLoading] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const MAX = 160

    const applyTemplate = (t) => {
        setForm(f => ({ ...f, message_body: t.body }))
        setShowTemplates(false)
        toast.success(`Template "${t.name}" applied`)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.list_id) return toast.error('Please select a contact list')
        setLoading(true)
        try {
            await createCampaign({
                ...form,
                list_id: parseInt(form.list_id),
                sender_id: form.sender_id ? parseInt(form.sender_id) : null,
                scheduled_at: form.scheduled_at || null,
            })
            toast.success('Campaign created!')
            navigate('/campaigns')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create campaign')
        } finally { setLoading(false) }
    }

    const charsLeft = MAX - form.message_body.length
    const hasMergeTags = /\{\{(first_name|last_name|phone)\}\}/i.test(form.message_body)

    return (
        <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Campaign</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Create a new SMS broadcast campaign</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={label}>Campaign name</label>
                        <input required style={inputStyle} placeholder="e.g. Weekend Sale Promo"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div>
                        <label style={label}>Contact list</label>
                        <select required style={{ ...inputStyle, cursor: 'pointer' }}
                            value={form.list_id} onChange={e => setForm({ ...form, list_id: e.target.value })}>
                            <option value="">Select a list...</option>
                            {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.contact_count?.toLocaleString()} contacts)</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={label}>Sender ID <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }}
                            value={form.sender_id} onChange={e => setForm({ ...form, sender_id: e.target.value })}>
                            <option value="">Default (numeric)</option>
                            {senderIds.map(s => <option key={s.id} value={s.id}>{s.sender_name}</option>)}
                        </select>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{ ...label, margin: 0 }}>Message</label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: charsLeft < 20 ? 'var(--danger)' : 'var(--text-muted)' }}>{charsLeft} left</span>
                                {templates.length > 0 && (
                                    <button type="button" onClick={() => setShowTemplates(true)}
                                        style={{ fontSize: 12, color: 'var(--accent)', background: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FileText size={12} /> Use template
                                    </button>
                                )}
                            </div>
                        </div>
                        <textarea required maxLength={MAX} rows={4}
                            style={{ ...inputStyle, resize: 'vertical' }}
                            placeholder={'Hi {{first_name}}, your message here...'}
                            value={form.message_body}
                            onChange={e => setForm({ ...form, message_body: e.target.value })}
                        />
                        {hasMergeTags && (
                            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>
                                ✓ Merge tags detected — messages will be personalized per contact
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={label}>Schedule <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                        <input type="datetime-local" style={inputStyle}
                            value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button type="submit" loading={loading}>Save Campaign</Button>
                        <Button type="button" variant="secondary" onClick={() => navigate('/campaigns')}>Cancel</Button>
                    </div>
                </form>
            </Card>

            <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Choose a Template" width={520}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                    {templates.map(t => (
                        <div key={t.id} onClick={() => applyTemplate(t)} style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.body}</div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    )
}
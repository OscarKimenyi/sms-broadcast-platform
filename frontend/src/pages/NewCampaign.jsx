import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createCampaign } from '../api/campaigns'
import { getLists } from '../api/contacts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
    padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
}
const label = { fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }

export default function NewCampaign() {
    const navigate = useNavigate()
    const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: getLists })
    const lists = listsData?.data?.lists || []

    const [form, setForm] = useState({ name: '', list_id: '', message_body: '', scheduled_at: '' })
    const [loading, setLoading] = useState(false)
    const MAX = 160
    const charsLeft = MAX - form.message_body.length

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.list_id) return toast.error('Please select a contact list')
        setLoading(true)
        try {
            await createCampaign({
                ...form,
                list_id: parseInt(form.list_id),
                scheduled_at: form.scheduled_at || null,
            })
            toast.success('Campaign created!')
            navigate('/campaigns')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create campaign')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Campaign</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
                    Create a new SMS broadcast campaign
                </p>
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
                            {lists.map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.contact_count?.toLocaleString()} contacts)</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ ...label, margin: 0 }}>Message</label>
                            <span style={{ fontSize: 12, color: charsLeft < 20 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {charsLeft} chars left
                            </span>
                        </div>
                        <textarea required maxLength={MAX} rows={4}
                            style={{ ...inputStyle, resize: 'vertical' }}
                            placeholder="Type your SMS message here..."
                            value={form.message_body}
                            onChange={e => setForm({ ...form, message_body: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={label}>Schedule (optional)</label>
                        <input type="datetime-local" style={inputStyle}
                            value={form.scheduled_at}
                            onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
                            Leave empty to send immediately when you click Send.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                        <Button type="submit" loading={loading}>Save Campaign</Button>
                        <Button type="button" variant="secondary" onClick={() => navigate('/campaigns')}>Cancel</Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
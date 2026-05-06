import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiKeys, createApiKey, revokeApiKey, deleteApiKey } from '../api/apikeys'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'
import { Plus, Copy, Trash2, Key, AlertTriangle } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }

export default function ApiKeys() {
    const qc = useQueryClient()
    const { data, isLoading } = useQuery({ queryKey: ['apiKeys'], queryFn: getApiKeys })
    const keys = data?.data?.api_keys || []
    const [showCreate, setShowCreate] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [creating, setCreating] = useState(false)
    const [revealedKey, setRevealedKey] = useState(null)

    const handleCreate = async (e) => {
        e.preventDefault(); setCreating(true)
        try {
            const res = await createApiKey({ name: newKeyName })
            setRevealedKey(res.data.key)
            setShowCreate(false); setNewKeyName('')
            qc.invalidateQueries(['apiKeys'])
        } catch { toast.error('Failed to create key') }
        finally { setCreating(false) }
    }

    const copyKey = (key) => { navigator.clipboard.writeText(key); toast.success('Copied!') }

    const handleRevoke = async (id) => {
        if (!confirm('Revoke this key? It will stop working immediately.')) return
        await revokeApiKey(id); toast.success('Key revoked')
        qc.invalidateQueries(['apiKeys'])
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this key permanently?')) return
        await deleteApiKey(id); toast.success('Key deleted')
        qc.invalidateQueries(['apiKeys'])
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>API Keys</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Use these to send SMS programmatically from your own apps</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Create Key</Button>
            </div>

            {revealedKey && (
                <Card style={{ border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <AlertTriangle size={16} color="var(--warning)" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>Save your API key now — it won't be shown again</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <code style={{ flex: 1, background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--accent)' }}>
                            {revealedKey}
                        </code>
                        <Button size="sm" onClick={() => copyKey(revealedKey)}><Copy size={13} /> Copy</Button>
                    </div>
                    <Button size="sm" variant="ghost" style={{ marginTop: 10 }} onClick={() => setRevealedKey(null)}>Dismiss</Button>
                </Card>
            )}

            <Card style={{ background: 'var(--info-dim)', border: '1px solid var(--info)33' }}>
                <p style={{ fontSize: 13, color: 'var(--info)', lineHeight: 1.7 }}>
                    <strong>How to use:</strong> Add the header <code style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>X-API-Key: your_key</code> to your requests. Each SMS sent via API deducts from your credit balance.
                </p>
            </Card>

            <Card padding="0">
                {isLoading ? <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                    : keys.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Key size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                            <p>No API keys yet.</p>
                        </div>
                    ) : keys.map((k, i) => (
                        <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < keys.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{k.name}</div>
                                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{k.key_prefix}••••••••••••</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Created {new Date(k.created_at).toLocaleDateString()} · {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Badge variant={k.is_active ? 'success' : 'danger'}>{k.is_active ? 'Active' : 'Revoked'}</Badge>
                                {k.is_active && <Button size="sm" variant="secondary" onClick={() => handleRevoke(k.id)}>Revoke</Button>}
                                <Button size="sm" variant="danger" onClick={() => handleDelete(k.id)}><Trash2 size={13} /></Button>
                            </div>
                        </div>
                    ))}
            </Card>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create API Key">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Key name / purpose</label>
                        <input required autoFocus style={inputStyle} placeholder="e.g. My Mobile App"
                            value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" loading={creating}>Create Key</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
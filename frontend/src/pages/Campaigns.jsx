import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCampaigns, deleteCampaign, sendCampaign } from '../api/campaigns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Send, Trash2, Eye } from 'lucide-react'

const statusVariant = { draft: 'neutral', queued: 'info', sending: 'warning', sent: 'success', failed: 'danger' }

export default function Campaigns() {
    const qc = useQueryClient()
    const { data, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns })
    const campaigns = data?.data?.campaigns || []

    const handleSend = async (id) => {
        try {
            await sendCampaign(id)
            toast.success('Campaign queued for sending!')
            qc.invalidateQueries(['campaigns'])
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this campaign?')) return
        try {
            await deleteCampaign(id)
            toast.success('Campaign deleted')
            qc.invalidateQueries(['campaigns'])
        } catch {
            toast.error('Failed to delete')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Campaigns</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{campaigns.length} total</p>
                </div>
                <Link to="/campaigns/new">
                    <Button><Plus size={15} /> New Campaign</Button>
                </Link>
            </div>

            <Card padding="0">
                {isLoading ? (
                    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                ) : campaigns.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ marginBottom: 12 }}>No campaigns yet.</p>
                        <Link to="/campaigns/new"><Button size="sm">Create your first campaign</Button></Link>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Name', 'Recipients', 'Delivered', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{c.name}</td>
                                    <td style={{ padding: '14px 16px', fontSize: 14, fontFamily: 'var(--font-mono)' }}>{c.total_recipients?.toLocaleString()}</td>
                                    <td style={{ padding: '14px 16px', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{c.delivered_count?.toLocaleString()}</td>
                                    <td style={{ padding: '14px 16px' }}><Badge variant={statusVariant[c.status]}>{c.status}</Badge></td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link to={`/campaigns/${c.id}`}><Button size="sm" variant="secondary"><Eye size={13} /></Button></Link>
                                            {['draft', 'failed'].includes(c.status) && (
                                                <Button size="sm" onClick={() => handleSend(c.id)}><Send size={13} /></Button>
                                            )}
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    )
}
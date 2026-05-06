import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminStats, getAdminUsers, adjustCredits, getPendingSenderIds, approveSenderId, rejectSenderId } from '../api/admin'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Users, Megaphone, Zap, Hash } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }

export default function Admin() {
    const qc = useQueryClient()
    const { data: statsData } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats })
    const { data: usersData, isLoading } = useQuery({ queryKey: ['adminUsers'], queryFn: () => getAdminUsers(1) })
    const { data: pendingSenders } = useQuery({ queryKey: ['pendingSenderIds'], queryFn: getPendingSenderIds })

    const stats = statsData?.data || {}
    const users = usersData?.data?.users || []
    const pendingIds = pendingSenders?.data?.sender_ids || []

    const [showAdjust, setShowAdjust] = useState(false)
    const [adjustForm, setAdjustForm] = useState({ user_id: '', amount: '', reason: '' })
    const [adjusting, setAdjusting] = useState(false)

    const handleAdjust = async (e) => {
        e.preventDefault(); setAdjusting(true)
        try {
            await adjustCredits({ ...adjustForm, amount: parseInt(adjustForm.amount), user_id: parseInt(adjustForm.user_id) })
            toast.success('Credits adjusted'); setShowAdjust(false)
            qc.invalidateQueries(['adminUsers'])
        } catch { toast.error('Failed') }
        finally { setAdjusting(false) }
    }

    const handleApprove = async (id) => {
        await approveSenderId(id); toast.success('Sender ID approved')
        qc.invalidateQueries(['pendingSenderIds'])
    }
    const handleReject = async (id) => {
        await rejectSenderId(id); toast.success('Sender ID rejected')
        qc.invalidateQueries(['pendingSenderIds'])
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Admin Dashboard</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Platform-wide management</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'var(--info)' },
                    { label: 'Total Campaigns', value: stats.total_campaigns, icon: Megaphone, color: 'var(--accent)' },
                    { label: 'SMS Sent', value: stats.total_sms_sent?.toLocaleString(), icon: Zap, color: 'var(--warning)' },
                    { label: 'Credits Sold', value: stats.total_credits_sold?.toLocaleString(), icon: Hash, color: '#a78bfa' },
                ].map(s => (
                    <Card key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</p>
                                <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value ?? '—'}</p>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={18} color={s.color} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pending Sender IDs */}
            {pendingIds.length > 0 && (
                <Card padding="0">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Pending Sender ID Approvals</h3>
                        <Badge variant="warning">{pendingIds.length}</Badge>
                    </div>
                    {pendingIds.map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < pendingIds.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{s.sender_name}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.user_name} · {s.user_email}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button size="sm" onClick={() => handleApprove(s.id)}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => handleReject(s.id)}>Reject</Button>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* Users table */}
            <Card padding="0">
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>All Users</h3>
                    <Button size="sm" variant="secondary" onClick={() => setShowAdjust(true)}>Adjust Credits</Button>
                </div>
                {isLoading ? <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                    : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    {['ID', 'Name', 'Email', 'Plan', 'Credits', 'Joined'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>#{u.id}</td>
                                        <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 500 }}>{u.name}</td>
                                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                                        <td style={{ padding: '12px 14px' }}><Badge variant="neutral">{u.plan}</Badge></td>
                                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{u.sms_credits?.toLocaleString()}</td>
                                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </Card>

            <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust User Credits">
                <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>User ID</label>
                        <input required type="number" style={inputStyle} placeholder="User ID number"
                            value={adjustForm.user_id} onChange={e => setAdjustForm({ ...adjustForm, user_id: e.target.value })} /></div>
                    <div><label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Credits to add (use negative to deduct)</label>
                        <input required type="number" style={inputStyle} placeholder="e.g. 500 or -100"
                            value={adjustForm.amount} onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })} /></div>
                    <div><label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason</label>
                        <input required style={inputStyle} placeholder="e.g. Compensation for failed sends"
                            value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" loading={adjusting}>Apply</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
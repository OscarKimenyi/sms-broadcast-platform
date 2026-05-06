import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCampaign, getCampaignLogs, sendCampaign } from '../api/campaigns'
import { duplicateCampaign, exportCampaignLogs } from '../api/campaigns'
import { Copy, Download } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Send, ArrowLeft } from 'lucide-react'

const statusVariant = { draft: 'neutral', queued: 'info', sending: 'warning', sent: 'success', failed: 'danger' }
const logVariant = { pending: 'neutral', sent: 'info', delivered: 'success', failed: 'danger' }

export default function CampaignDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data, isLoading, refetch } = useQuery({ queryKey: ['campaign', id], queryFn: () => getCampaign(id) })
    const { data: logsData, isLoading: loadingLogs } = useQuery({ queryKey: ['logs', id], queryFn: () => getCampaignLogs(id) })

    const campaign = data?.data?.campaign
    const logs = logsData?.data?.logs || []

    const handleSend = async () => {
        try {
            await sendCampaign(id)
            toast.success('Campaign queued for sending!')
            refetch()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send')
        }
    }

    const handleDuplicate = async () => {
        try {
            const res = await duplicateCampaign(id)
            toast.success('Campaign duplicated!')
            navigate(`/campaigns/${res.data.id}`)
        } catch { toast.error('Failed to duplicate') }
    }

    const handleExport = async (format) => {
        try {
            const res = await exportCampaignLogs(id, format)
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `campaign_${id}_report.${format}`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch { toast.error('Export failed') }
    }

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}><Spinner size={32} /></div>
    if (!campaign) return <p style={{ color: 'var(--text-muted)' }}>Campaign not found.</p>

    const deliveryRate = campaign.total_recipients > 0
        ? Math.round((campaign.delivered_count / campaign.total_recipients) * 100)
        : 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}><ArrowLeft size={15} /> Back</Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{campaign.name}</h2>
                        <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Created {new Date(campaign.created_at).toLocaleString()}</p>
                </div>
                {['draft', 'failed'].includes(campaign.status) && (
                    <Button onClick={handleSend}><Send size={14} /> Send Now</Button>
                )}
                <Button variant="secondary" onClick={handleDuplicate}><Copy size={14} /> Duplicate</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}><Download size={13} /> CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}><Download size={13} /> Excel</Button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Recipients', value: campaign.total_recipients?.toLocaleString(), color: 'var(--text-primary)' },
                    { label: 'Sent', value: campaign.sent_count?.toLocaleString(), color: 'var(--info)' },
                    { label: 'Delivered', value: campaign.delivered_count?.toLocaleString(), color: 'var(--accent)' },
                    { label: 'Failed', value: campaign.failed_count?.toLocaleString(), color: 'var(--danger)' },
                    { label: 'Delivery Rate', value: `${deliveryRate}%`, color: 'var(--warning)' },
                ].map(s => (
                    <Card key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* Message */}
            <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>MESSAGE BODY</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {campaign.message_body}
                </p>
            </Card>

            {/* Logs */}
            <Card padding="0">
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Delivery Log</h3>
                </div>
                {loadingLogs ? (
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No logs yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Phone Number', 'Status', 'Sent At', 'Delivered At'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{log.phone_number}</td>
                                    <td style={{ padding: '12px 16px' }}><Badge variant={logVariant[log.status]}>{log.status}</Badge></td>
                                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{log.delivered_at ? new Date(log.delivered_at).toLocaleString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    )
}
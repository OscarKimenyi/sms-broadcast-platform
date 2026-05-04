import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getCampaigns } from '../api/campaigns'
import { getBalance } from '../api/billing'
import { getLists } from '../api/contacts'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { Link } from 'react-router-dom'
import { Megaphone, Users, Zap, TrendingUp, ArrowRight } from 'lucide-react'

function StatCard({ label, value, icon: Icon, accent = 'var(--accent)', sub }) {
    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent }}>
                        {value}
                    </p>
                    {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: accent + '18', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={accent} />
                </div>
            </div>
        </Card>
    )
}

const statusVariant = { draft: 'neutral', queued: 'info', sending: 'warning', sent: 'success', failed: 'danger' }

export default function Dashboard() {
    const { user } = useAuth()
    const { data: campaignsData, isLoading: loadingC } = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns })
    const { data: balanceData } = useQuery({ queryKey: ['balance'], queryFn: getBalance })
    const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: getLists })

    const campaigns = campaignsData?.data?.campaigns || []
    const recent = campaigns.slice(0, 5)
    const totalSent = campaigns.reduce((s, c) => s + (c.delivered_count || 0), 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>
                    Good day, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                    Here's what's happening with your SMS campaigns.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard
                    label="SMS Credits"
                    value={(balanceData?.data?.credits ?? user?.sms_credits ?? 0).toLocaleString()}
                    icon={Zap}
                    sub="Available balance"
                />
                <StatCard
                    label="Campaigns"
                    value={campaigns.length}
                    icon={Megaphone}
                    accent="var(--info)"
                    sub="Total created"
                />
                <StatCard
                    label="Contact Lists"
                    value={listsData?.data?.lists?.length ?? 0}
                    icon={Users}
                    accent="var(--warning)"
                    sub="Total lists"
                />
                <StatCard
                    label="SMS Delivered"
                    value={totalSent.toLocaleString()}
                    icon={TrendingUp}
                    accent="#a78bfa"
                    sub="All time"
                />
            </div>

            {/* Recent campaigns */}
            <Card padding="0">
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Campaigns</h3>
                    <Link to="/campaigns" style={{ fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View all <ArrowRight size={13} />
                    </Link>
                </div>
                {loadingC ? (
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <Spinner />
                    </div>
                ) : recent.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        No campaigns yet.{' '}
                        <Link to="/campaigns" style={{ color: 'var(--accent)' }}>Create your first one →</Link>
                    </div>
                ) : (
                    <div>
                        {recent.map((c, i) => (
                            <Link to={`/campaigns/${c.id}`} key={c.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem 1.5rem',
                                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {c.total_recipients?.toLocaleString()} recipients · {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ textAlign: 'right', fontSize: 13 }}>
                                        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                                            {c.delivered_count?.toLocaleString()}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}> delivered</span>
                                    </div>
                                    <Badge variant={statusVariant[c.status] || 'neutral'}>{c.status}</Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Megaphone, Users, Inbox,
    CreditCard, LogOut, Zap, Hash, FileText,
    Key, Settings, ShieldCheck
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/sender-ids', icon: Hash, label: 'Sender IDs' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/inbox', icon: Inbox, label: 'Inbox' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/api-keys', icon: Key, label: 'API Keys' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const isAdmin = user?.id === 1

    return (
        <aside style={{
            width: 'var(--sidebar-w)', background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)', display: 'flex',
            flexDirection: 'column', height: '100vh',
            position: 'fixed', top: 0, left: 0, zIndex: 100, overflowY: 'auto',
        }}>
            <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={18} color="#0d0f12" fill="#0d0f12" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>SMSPulse</span>
                </div>
            </div>

            <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    })}>
                        <Icon size={16} />{label}
                    </NavLink>
                ))}

                {isAdmin && (
                    <>
                        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                        <NavLink to="/admin" style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                            fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                            background: isActive ? '#ffd16618' : 'transparent',
                            color: isActive ? 'var(--warning)' : 'var(--text-secondary)',
                        })}>
                            <ShieldCheck size={16} />Admin
                        </NavLink>
                    </>
                )}
            </nav>

            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '6px 10px', marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {user?.sms_credits?.toLocaleString()} credits
                    </div>
                </div>
                <button onClick={() => { logout(); navigate('/login') }} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                    fontSize: 14, color: 'var(--text-muted)', background: 'none', width: '100%',
                }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                >
                    <LogOut size={16} />Sign out
                </button>
            </div>
        </aside>
    )
}
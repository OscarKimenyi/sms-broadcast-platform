import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Megaphone, Users, Inbox,
    CreditCard, LogOut, Zap
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/inbox', icon: Inbox, label: 'Inbox' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <aside style={{
            width: 'var(--sidebar-w)', background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)', display: 'flex',
            flexDirection: 'column', height: '100vh', position: 'fixed',
            top: 0, left: 0, zIndex: 100,
        }}>
            {/* Logo */}
            <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, background: 'var(--accent)',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={18} color="#0d0f12" fill="#0d0f12" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
                        SMSPulse
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    })}>
                        <Icon size={17} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '8px 12px', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {user?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {user?.sms_credits?.toLocaleString()} credits
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: 14, color: 'var(--text-muted)', background: 'none',
                        width: '100%', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                >
                    <LogOut size={17} />
                    Sign out
                </button>
            </div>
        </aside>
    )
}
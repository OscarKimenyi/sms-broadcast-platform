import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Zap } from 'lucide-react'

const titles = {
    '/dashboard': 'Dashboard',
    '/campaigns': 'Campaigns',
    '/contacts': 'Contacts',
    '/inbox': 'Inbox',
    '/billing': 'Billing',
}

export default function TopBar() {
    const { pathname } = useLocation()
    const { user } = useAuth()
    const title = titles[pathname] || 'SMSPulse'

    return (
        <header style={{
            height: 60, background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50,
        }}>
            <h1 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h1>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-dim)', border: '1px solid var(--accent)33',
                padding: '5px 12px', borderRadius: 99, fontSize: 13,
            }}>
                <Zap size={13} color="var(--accent)" />
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {user?.sms_credits?.toLocaleString() ?? 0}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>credits</span>
            </div>
        </header>
    )
}
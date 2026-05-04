import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <TopBar />
                <main style={{ flex: 1, padding: '1.75rem', maxWidth: 1100 }} className="fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
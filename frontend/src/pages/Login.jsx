import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
    padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
}

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await loginApi(form)
            login(data.user, data.token)
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg-base)', padding: '1rem',
        }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 48, height: 48, background: 'var(--accent)',
                        borderRadius: 12, display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                        <Zap size={24} color="#0d0f12" fill="#0d0f12" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>SMSPulse</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Sign in to your account</p>
                </div>

                {/* Form */}
                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.75rem',
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                Email address
                            </label>
                            <input
                                type="email" required style={inputStyle}
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                Password
                            </label>
                            <input
                                type="password" required style={inputStyle}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                        <Button type="submit" fullWidth loading={loading}>Sign in</Button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--accent)' }}>Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
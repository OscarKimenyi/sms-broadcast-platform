import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/auth'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
    padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
}

export default function Register() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await registerApi(form)
            login(data.user, data.token)
            toast.success('Account created! Welcome to SMSPulse.')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
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
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 48, height: 48, background: 'var(--accent)',
                        borderRadius: 12, display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                        <Zap size={24} color="#0d0f12" fill="#0d0f12" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>Create account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Start sending SMS campaigns today</p>
                </div>

                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.75rem',
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full name</label>
                            <input type="text" required style={inputStyle} placeholder="Oscar Kimenyi"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email address</label>
                            <input type="email" required style={inputStyle} placeholder="you@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                            <input type="password" required minLength={6} style={inputStyle} placeholder="Min. 6 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <Button type="submit" fullWidth loading={loading}>Create account</Button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
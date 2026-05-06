import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword } from '../api/auth'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Copy, Gift } from 'lucide-react'

const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }
const label = { fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }

export default function Settings() {
    const { user, login } = useAuth()
    const token = localStorage.getItem('token')
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', email_notifications: user?.email_notifications ?? 1, low_credit_threshold: user?.low_credit_threshold || 100 })
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPw, setSavingPw] = useState(false)

    const handleProfileSave = async (e) => {
        e.preventDefault(); setSavingProfile(true)
        try {
            await updateProfile(profile)
            login({ ...user, ...profile }, token)
            toast.success('Profile updated')
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setSavingProfile(false) }
    }

    const handlePasswordSave = async (e) => {
        e.preventDefault()
        if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match')
        setSavingPw(true)
        try {
            await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
            toast.success('Password changed')
            setPwForm({ current_password: '', new_password: '', confirm: '' })
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setSavingPw(false) }
    }

    const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`
    const copyReferral = () => { navigator.clipboard.writeText(referralLink); toast.success('Referral link copied!') }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Manage your account preferences</p>
            </div>

            {/* Profile */}
            <Card>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.25rem' }}>Profile</h3>
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><label style={label}>Full name</label>
                        <input required style={inputStyle} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                    <div><label style={label}>Email address</label>
                        <input required type="email" style={inputStyle} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>Email notifications</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Campaign completions, low credits, receipts</div>
                        </div>
                        <input type="checkbox" checked={!!profile.email_notifications}
                            onChange={e => setProfile({ ...profile, email_notifications: e.target.checked ? 1 : 0 })}
                            style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </div>
                    <div><label style={label}>Low credit alert threshold</label>
                        <input type="number" min={0} style={inputStyle} value={profile.low_credit_threshold}
                            onChange={e => setProfile({ ...profile, low_credit_threshold: parseInt(e.target.value) })} />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Send email alert when credits drop below this number</p>
                    </div>
                    <Button type="submit" loading={savingProfile}>Save Profile</Button>
                </form>
            </Card>

            {/* Password */}
            <Card>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.25rem' }}>Change Password</h3>
                <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><label style={label}>Current password</label>
                        <input required type="password" style={inputStyle} value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} /></div>
                    <div><label style={label}>New password</label>
                        <input required type="password" minLength={6} style={inputStyle} value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} /></div>
                    <div><label style={label}>Confirm new password</label>
                        <input required type="password" style={inputStyle} value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
                    <Button type="submit" loading={savingPw}>Change Password</Button>
                </form>
            </Card>

            {/* Referral */}
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                    <Gift size={18} color="var(--accent)" />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Refer & Earn</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                    Share your referral link. When someone signs up and makes their first purchase, you both get <strong style={{ color: 'var(--accent)' }}>100 free SMS credits</strong>.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <code style={{ flex: 1, background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {referralLink}
                    </code>
                    <Button size="sm" onClick={copyReferral}><Copy size={13} /> Copy</Button>
                </div>
            </Card>
        </div>
    )
}
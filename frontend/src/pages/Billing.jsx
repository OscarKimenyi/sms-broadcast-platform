import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getBalance, getCreditPacks, buyCredits, verifyPayment } from '../api/billing'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Zap, CreditCard } from 'lucide-react'

export default function Billing() {
    const { updateCredits } = useAuth()
    const qc = useQueryClient()
    const [params] = useSearchParams()

    const { data: balanceData, isLoading } = useQuery({ queryKey: ['balance'], queryFn: getBalance })
    const { data: packsData } = useQuery({ queryKey: ['packs'], queryFn: getCreditPacks })

    const balance = balanceData?.data
    const packs = packsData?.data?.packs || {}
    const transactions = balance?.transactions || []

    // Handle Snippe redirect back after payment
    useEffect(() => {
        const sessionRef = params.get('session_reference')
        if (!sessionRef) return

        verifyPayment(sessionRef)
            .then(res => {
                if (res.data.alreadyCredited) {
                    toast.success('Payment already processed.')
                } else {
                    toast.success(res.data.message)
                    updateCredits(res.data.credits)
                    qc.invalidateQueries(['balance'])
                }
            })
            .catch(() => toast.error('Payment verification failed. Contact support if you were charged.'))
    }, [])

    const handleBuy = async (pack) => {
        try {
            const res = await buyCredits(pack)
            window.location.href = res.data.url
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Billing</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Manage your SMS credits</p>
            </div>

            {/* Balance */}
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, background: 'var(--accent-dim)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={24} color="var(--accent)" />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Available credits</p>
                        {isLoading ? <Spinner size={20} /> : (
                            <p style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1.2 }}>
                                {(balance?.credits ?? 0).toLocaleString()}
                            </p>
                        )}
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>1 credit = 1 SMS sent</p>
                    </div>
                </div>
            </Card>

            {/* Credit packs */}
            <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>Buy Credits</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(packs).map(([key, pack]) => (
                        <Card key={key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                                    {pack.credits.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>SMS Credits</div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 600 }}>
                                TZS {pack.amount.toLocaleString()}
                            </div>
                            <Button fullWidth variant="secondary" onClick={() => handleBuy(key)}>
                                <CreditCard size={14} /> Buy Now
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Transaction history */}
            <Card padding="0">
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Transaction History</h3>
                </div>
                {transactions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        No transactions yet.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Description', 'Type', 'Credits', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{t.description}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: t.type === 'topup' ? 'var(--accent)' : t.type === 'spend' ? 'var(--danger)' : 'var(--text-muted)' }}>
                                        {t.type}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: t.credits_change > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                        {t.credits_change > 0 ? '+' : ''}{t.credits_change.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    )
}
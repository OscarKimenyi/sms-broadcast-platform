import Card from '../components/ui/Card'
import { MessageSquare } from 'lucide-react'

export default function Inbox() {
    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Inbox</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Inbound SMS replies from your contacts</p>
            </div>
            <Card>
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>No messages yet.</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>When contacts reply to your campaigns, their messages will appear here.</p>
                </div>
            </Card>
        </div>
    )
}
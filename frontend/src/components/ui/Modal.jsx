import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, width = 480 }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: '#000000aa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="fade-in"
                style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
                    padding: '1.75rem',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    )
}
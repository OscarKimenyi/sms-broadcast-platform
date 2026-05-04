export default function Card({ children, style = {}, padding = '1.5rem' }) {
    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding,
            ...style,
        }}>
            {children}
        </div>
    )
}
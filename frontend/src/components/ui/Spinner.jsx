export default function Spinner({ size = 20, color = 'var(--accent)' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `2px solid ${color}22`,
            borderTop: `2px solid ${color}`,
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
        }} />
    )
}
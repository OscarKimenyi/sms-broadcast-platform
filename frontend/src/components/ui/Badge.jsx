const variants = {
    success: { bg: '#00e67620', color: '#00e676' },
    danger: { bg: '#ff4d6d18', color: '#ff4d6d' },
    warning: { bg: '#ffd16618', color: '#ffd166' },
    info: { bg: '#48cae418', color: '#48cae4' },
    neutral: { bg: '#8892a018', color: '#8892a0' },
}

export default function Badge({ children, variant = 'neutral' }) {
    const v = variants[variant] || variants.neutral
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
            fontSize: 12, fontWeight: 500, background: v.bg, color: v.color,
        }}>
            {children}
        </span>
    )
}
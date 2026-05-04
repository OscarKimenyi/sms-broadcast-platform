import Spinner from './Spinner'

export default function Button({
    children, onClick, type = 'button', variant = 'primary',
    size = 'md', loading = false, disabled = false, fullWidth = false, style = {}
}) {
    const base = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, fontWeight: 500, borderRadius: 'var(--radius-sm)',
        transition: 'all 0.15s', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto', border: '1px solid transparent',
        ...style,
    }
    const sizes = {
        sm: { padding: '6px 12px', fontSize: 13 },
        md: { padding: '9px 18px', fontSize: 14 },
        lg: { padding: '12px 24px', fontSize: 15 },
    }
    const variants = {
        primary: {
            background: 'var(--accent)', color: '#0d0f12', borderColor: 'var(--accent)',
        },
        secondary: {
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            borderColor: 'var(--border-light)',
        },
        danger: {
            background: 'var(--danger-dim)', color: 'var(--danger)',
            borderColor: 'var(--danger)',
        },
        ghost: {
            background: 'transparent', color: 'var(--text-secondary)',
            borderColor: 'transparent',
        },
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            style={{ ...base, ...sizes[size], ...variants[variant] }}
        >
            {loading && <Spinner size={14} color={variant === 'primary' ? '#0d0f12' : 'var(--accent)'} />}
            {children}
        </button>
    )
}
export default function FormField({ label, hint, error, required, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs" style={{ color: '#475569' }}>{hint}</p>}
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
    )
}

export function Input({ ...props }) {
    return (
        <input
            {...props}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                ...props.style,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#10b981' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#334155' }}
        />
    )
}

export function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                ...props.style,
            }}
        >
            {children}
        </select>
    )
}

export function Btn({ children, variant = 'primary', size = 'md', ...props }) {
    const base = {
        primary: { background: '#10b981', color: '#fff', border: '1px solid #10b981' },
        secondary: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
        danger: { background: 'transparent', color: '#ef4444', border: '1px solid #ef4444' },
        ghost: { background: 'transparent', color: '#94a3b8', border: '1px solid transparent' },
    }
    const sizes = {
        sm: { padding: '6px 12px', fontSize: '12px' },
        md: { padding: '8px 16px', fontSize: '14px' },
        lg: { padding: '12px 24px', fontSize: '15px' },
    }
    return (
        <button
            {...props}
            style={{
                ...base[variant],
                ...sizes[size],
                borderRadius: '8px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: props.disabled ? 'not-allowed' : 'pointer',
                opacity: props.disabled ? 0.5 : 1,
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                ...props.style,
            }}
            onMouseEnter={e => { if (!props.disabled) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = props.disabled ? '0.5' : '1' }}
        >
            {children}
        </button>
    )
}

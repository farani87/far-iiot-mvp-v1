export default function Modal({ title, onClose, children, width = '520px' }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full fade-in rounded-xl"
                style={{
                    maxWidth: width,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
                    <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        ✕
                    </button>
                </div>
                {/* Body */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

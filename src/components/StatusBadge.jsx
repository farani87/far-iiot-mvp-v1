export default function StatusBadge({ status }) {
    const isOnline = status === 'online'
    const isConnecting = status === 'connecting'

    return (
        <div className="flex items-center gap-2">
            <span
                className={isOnline ? 'pulse-online' : ''}
                style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isOnline ? '#10b981' : isConnecting ? '#f59e0b' : '#ef4444',
                    flexShrink: 0,
                }}
            />
            <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{
                    color: isOnline ? '#10b981' : isConnecting ? '#f59e0b' : '#ef4444',
                }}
            >
                {isOnline ? 'Online' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
        </div>
    )
}

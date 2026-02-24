// Render a JSON value as a colored tree node
function JsonValue({ value, depth = 0 }) {
    if (value === null) return <span className="json-null">null</span>
    if (typeof value === 'boolean') return <span className="json-boolean">{String(value)}</span>
    if (typeof value === 'number') return <span className="json-number">{value}</span>
    if (typeof value === 'string') return <span className="json-string">"{value}"</span>
    if (Array.isArray(value)) {
        if (value.length === 0) return <span style={{ color: '#94a3b8' }}>[]</span>
        return (
            <span>
                {'['}
                <div style={{ paddingLeft: (depth + 1) * 16 }}>
                    {value.map((item, i) => (
                        <div key={i}>
                            <JsonValue value={item} depth={depth + 1} />
                            {i < value.length - 1 && <span style={{ color: '#475569' }}>,</span>}
                        </div>
                    ))}
                </div>
                {']'}
            </span>
        )
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value)
        if (keys.length === 0) return <span style={{ color: '#94a3b8' }}>{'{}'}</span>
        return (
            <span>
                {'{'}
                <div style={{ paddingLeft: (depth + 1) * 16 }}>
                    {keys.map((key, i) => (
                        <div key={key}>
                            <span className="json-key">"{key}"</span>
                            <span style={{ color: '#475569' }}>: </span>
                            <JsonValue value={value[key]} depth={depth + 1} />
                            {i < keys.length - 1 && <span style={{ color: '#475569' }}>,</span>}
                        </div>
                    ))}
                </div>
                {'}'}
            </span>
        )
    }
    return <span style={{ color: '#94a3b8' }}>{String(value)}</span>
}

export default function JsonTreeView({ data, title, maxHeight = '280px' }) {
    if (!data) {
        return (
            <div
                className="rounded-lg p-4 text-sm"
                style={{ background: '#0a111e', border: '1px solid #1e293b', color: '#475569', fontFamily: 'monospace' }}
            >
                No data yet...
            </div>
        )
    }
    return (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1e293b' }}>
            {title && (
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94a3b8' }}>{title}</span>
                </div>
            )}
            <div
                className="p-4 overflow-auto text-xs leading-relaxed"
                style={{ background: '#0a111e', fontFamily: '"Fira Code", "Cascadia Code", monospace', maxHeight }}
            >
                <JsonValue value={data} />
            </div>
        </div>
    )
}

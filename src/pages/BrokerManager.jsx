import { useState } from 'react'
import { useMqttBrokers } from '../hooks/useMqttBrokers.js'
import { BROKER_PRESETS } from '../utils/brokerPresets.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import FormField, { Input, Btn } from '../components/FormField.jsx'

const EMPTY_FORM = { name: '', wsUrl: '', port: '', clientId: '' }

export default function BrokerManager() {
    const { brokers, addBroker, updateBroker, deleteBroker, connectBroker, disconnectBroker } = useMqttBrokers()
    const [showModal, setShowModal] = useState(false)
    const [editBroker, setEditBroker] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})

    function openCreate() {
        setEditBroker(null)
        setForm(EMPTY_FORM)
        setErrors({})
        setShowModal(true)
    }

    function openEdit(broker) {
        setEditBroker(broker)
        setForm({ name: broker.name, wsUrl: broker.wsUrl, port: broker.port || '', clientId: broker.clientId || '' })
        setErrors({})
        setShowModal(true)
    }

    function applyPreset(preset) {
        setForm({ name: preset.name, wsUrl: preset.wsUrl, port: preset.port, clientId: '' })
        setErrors({})
    }

    function validate() {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required'
        if (!form.wsUrl.trim()) e.wsUrl = 'WebSocket URL is required'
        return e
    }

    function handleSubmit() {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        if (editBroker) {
            updateBroker(editBroker.id, form)
        } else {
            addBroker(form)
        }
        setShowModal(false)
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>MQTT Brokers</h2>
                    <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
                        Manage WebSocket MQTT broker connections
                    </p>
                </div>
                <Btn onClick={openCreate}>+ New Broker</Btn>
            </div>

            {/* Quick-add presets */}
            <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#475569' }}>
                    Free Public Brokers — Quick Add
                </p>
                <div className="flex flex-wrap gap-2">
                    {BROKER_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => {
                                setEditBroker(null)
                                setForm({ name: preset.name, wsUrl: preset.wsUrl, port: preset.port, clientId: '' })
                                setErrors({})
                                setShowModal(true)
                            }}
                            style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#94a3b8',
                                padding: '6px 14px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#10b981'
                                e.currentTarget.style.color = '#10b981'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#334155'
                                e.currentTarget.style.color = '#94a3b8'
                            }}
                            title={preset.description}
                        >
                            <span style={{ color: '#10b981' }}>+</span>
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {brokers.length === 0 && (
                <div
                    className="rounded-xl p-12 text-center"
                    style={{ background: '#1e293b', border: '1px dashed #334155' }}
                >
                    <div className="text-4xl mb-3">⚡</div>
                    <p className="font-medium mb-1" style={{ color: '#e2e8f0' }}>No brokers yet</p>
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>Use a quick-add above or add a custom broker</p>
                    <Btn onClick={openCreate}>Add Custom Broker</Btn>
                </div>
            )}

            {/* Broker table */}
            {brokers.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
                    <div
                        className="grid text-xs font-medium uppercase tracking-wide px-4 py-3"
                        style={{
                            background: '#1e293b',
                            color: '#475569',
                            gridTemplateColumns: '1fr 2fr 100px 130px',
                            borderBottom: '1px solid #334155',
                        }}
                    >
                        <span>Name</span>
                        <span>WebSocket URL</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {brokers.map((broker, idx) => (
                        <div
                            key={broker.id}
                            className="grid items-center px-4 py-3 transition-colors"
                            style={{
                                gridTemplateColumns: '1fr 2fr 100px 130px',
                                background: idx % 2 === 0 ? '#0f172a' : '#111827',
                                borderBottom: idx < brokers.length - 1 ? '1px solid #1e293b' : 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#0f172a' : '#111827'}
                        >
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{broker.name}</p>
                                <p className="text-xs mt-0.5 font-mono" style={{ color: '#475569' }}>
                                    {broker.clientId?.slice(0, 24) || '—'}
                                </p>
                            </div>
                            <p className="text-xs font-mono truncate pr-2" style={{ color: '#94a3b8' }}>
                                {broker.wsUrl}
                            </p>
                            <StatusBadge status={broker.status} />
                            <div className="flex gap-1">
                                {broker.status === 'offline' || broker.status === undefined ? (
                                    <Btn size="sm" onClick={() => connectBroker(broker)}>Connect</Btn>
                                ) : (
                                    <Btn size="sm" variant="secondary" onClick={() => disconnectBroker(broker.id)}>Disc.</Btn>
                                )}
                                <Btn size="sm" variant="ghost" onClick={() => openEdit(broker)}>✏️</Btn>
                                <Btn size="sm" variant="ghost" onClick={() => deleteBroker(broker.id)}>🗑️</Btn>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            {brokers.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Total: <strong style={{ color: '#e2e8f0' }}>{brokers.length}</strong>
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Online: <strong style={{ color: '#10b981' }}>{brokers.filter(b => b.status === 'online').length}</strong>
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Offline: <strong style={{ color: '#ef4444' }}>{brokers.filter(b => b.status !== 'online').length}</strong>
                    </span>
                </div>
            )}

            {/* HTTPS warning */}
            <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: '#1c1a0d', border: '1px solid #3d3000' }}>
                <span className="text-sm mt-0.5">⚠️</span>
                <p className="text-xs leading-relaxed" style={{ color: '#a18600' }}>
                    <strong style={{ color: '#d4a700' }}>HTTPS deployments require WSS.</strong>{' '}
                    If you deploy to Vercel/Netlify, your browser will block <code>ws://</code> connections from an <code>https://</code> site.
                    Use the <strong>WSS</strong> variants above (wss://), or ensure your broker supports TLS on port 8084 / 8081.
                </p>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal title={editBroker ? 'Edit Broker' : 'New MQTT Broker'} onClose={() => setShowModal(false)}>
                    <div className="flex flex-col gap-4">
                        {/* Preset picker inside modal */}
                        {!editBroker && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#475569' }}>
                                    Quick presets
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {BROKER_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => applyPreset(preset)}
                                            style={{
                                                background: form.wsUrl === preset.wsUrl ? '#0d2d1e' : '#0f172a',
                                                border: `1px solid ${form.wsUrl === preset.wsUrl ? '#10b981' : '#334155'}`,
                                                color: form.wsUrl === preset.wsUrl ? '#10b981' : '#94a3b8',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontFamily: 'Inter, sans-serif',
                                                cursor: 'pointer',
                                                transition: 'all 0.1s',
                                            }}
                                            title={preset.description}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                                {form.wsUrl && (
                                    <p className="text-xs mt-2" style={{ color: '#475569' }}>
                                        {BROKER_PRESETS.find(p => p.wsUrl === form.wsUrl)?.description || ''}
                                    </p>
                                )}
                            </div>
                        )}

                        <FormField label="Name" required error={errors.name}>
                            <Input
                                placeholder="e.g. EMQX Public WS"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </FormField>

                        <FormField
                            label="Full WebSocket URL"
                            required
                            error={errors.wsUrl}
                            hint="Include port in URL, e.g. ws://broker.emqx.io:8083/mqtt"
                        >
                            <Input
                                placeholder="ws://broker.emqx.io:8083/mqtt"
                                value={form.wsUrl}
                                onChange={e => setForm({ ...form, wsUrl: e.target.value })}
                                style={{ fontFamily: 'monospace' }}
                            />
                        </FormField>

                        <FormField label="Client ID" hint="Auto-generated if left empty">
                            <Input
                                placeholder="far-iiot-client-01"
                                value={form.clientId}
                                onChange={e => setForm({ ...form, clientId: e.target.value })}
                            />
                        </FormField>

                        <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid #334155' }}>
                            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
                            <Btn onClick={handleSubmit}>{editBroker ? 'Save Changes' : 'Add & Connect'}</Btn>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

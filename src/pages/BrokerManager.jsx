import { useState } from 'react'
import { useMqttBrokers } from '../hooks/useMqttBrokers.js'
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
                <Btn onClick={openCreate}>
                    <span>+</span> New Broker
                </Btn>
            </div>

            {/* Empty state */}
            {brokers.length === 0 && (
                <div
                    className="rounded-xl p-12 text-center"
                    style={{ background: '#1e293b', border: '1px dashed #334155' }}
                >
                    <div className="text-4xl mb-3">⚡</div>
                    <p className="font-medium mb-1" style={{ color: '#e2e8f0' }}>No brokers yet</p>
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>Add your first MQTT WebSocket broker to get started</p>
                    <Btn onClick={openCreate}>Add First Broker</Btn>
                </div>
            )}

            {/* Broker table */}
            {brokers.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
                    {/* Table header */}
                    <div
                        className="grid text-xs font-medium uppercase tracking-wide px-4 py-3"
                        style={{
                            background: '#1e293b',
                            color: '#475569',
                            gridTemplateColumns: '1fr 2fr 80px 100px 120px',
                            borderBottom: '1px solid #334155',
                        }}
                    >
                        <span>Name</span>
                        <span>WebSocket URL</span>
                        <span>Port</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {/* Rows */}
                    {brokers.map((broker, idx) => (
                        <div
                            key={broker.id}
                            className="grid items-center px-4 py-3 transition-colors"
                            style={{
                                gridTemplateColumns: '1fr 2fr 80px 100px 120px',
                                background: idx % 2 === 0 ? '#0f172a' : '#111827',
                                borderBottom: idx < brokers.length - 1 ? '1px solid #1e293b' : 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#0f172a' : '#111827'}
                        >
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{broker.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{broker.clientId}</p>
                            </div>
                            <p className="text-sm font-mono" style={{ color: '#94a3b8' }}>{broker.wsUrl}</p>
                            <p className="text-sm font-mono" style={{ color: '#94a3b8' }}>{broker.port || '—'}</p>
                            <StatusBadge status={broker.status} />
                            <div className="flex gap-1">
                                {broker.status === 'offline' ? (
                                    <Btn size="sm" onClick={() => connectBroker(broker)}>Connect</Btn>
                                ) : (
                                    <Btn size="sm" variant="secondary" onClick={() => disconnectBroker(broker.id)}>Disconnect</Btn>
                                )}
                                <Btn size="sm" variant="ghost" onClick={() => openEdit(broker)}>✏️</Btn>
                                <Btn size="sm" variant="ghost" onClick={() => deleteBroker(broker.id)}>🗑️</Btn>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats bar */}
            {brokers.length > 0 && (
                <div className="flex gap-4 mt-4">
                    <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Total: <strong style={{ color: '#e2e8f0' }}>{brokers.length}</strong>
                    </div>
                    <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Online: <strong style={{ color: '#10b981' }}>{brokers.filter((b) => b.status === 'online').length}</strong>
                    </div>
                    <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Offline: <strong style={{ color: '#ef4444' }}>{brokers.filter((b) => b.status === 'offline').length}</strong>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal title={editBroker ? 'Edit Broker' : 'New MQTT Broker'} onClose={() => setShowModal(false)}>
                    <div className="flex flex-col gap-4">
                        <FormField label="Name" required error={errors.name}>
                            <Input
                                placeholder="e.g. Factory Floor Broker"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </FormField>

                        <FormField label="WebSocket URL" required error={errors.wsUrl} hint="e.g. ws://192.168.1.100 or wss://broker.example.com">
                            <Input
                                placeholder="ws://your-broker-host"
                                value={form.wsUrl}
                                onChange={e => setForm({ ...form, wsUrl: e.target.value })}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Port" hint="Default: 9001 (WebSocket)">
                                <Input
                                    type="number"
                                    placeholder="9001"
                                    value={form.port}
                                    onChange={e => setForm({ ...form, port: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Client ID" hint="Auto-generated if empty">
                                <Input
                                    placeholder="far-iiot-client-01"
                                    value={form.clientId}
                                    onChange={e => setForm({ ...form, clientId: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid #334155' }}>
                            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
                            <Btn onClick={handleSubmit}>{editBroker ? 'Save Changes' : 'Add Broker'}</Btn>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

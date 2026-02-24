import { useState } from 'react'
import { getBrokers } from '../utils/storage.js'
import { useDeviceManager, DEFAULT_DEVICE, buildTargetTopic } from '../hooks/useDeviceManager.js'
import Modal from '../components/Modal.jsx'
import { Btn } from '../components/FormField.jsx'
import DeviceEditor from '../components/DeviceEditor.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function DevicesPage() {
    const [brokers] = useState(() => getBrokers())
    const { devices, addDevice, updateDevice, deleteDevice, toggleLive } = useDeviceManager(brokers)

    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)    // null = creating new
    const [draftDevice, setDraftDevice] = useState(DEFAULT_DEVICE)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    function openCreate() {
        setEditingId(null)
        setDraftDevice({ ...DEFAULT_DEVICE, metricGroups: [] })
        setModalOpen(true)
    }

    function openEdit(device) {
        setEditingId(device.id)
        setDraftDevice({ ...device })
        setModalOpen(true)
    }

    function handleSave() {
        if (!draftDevice.name?.trim()) return
        if (editingId) {
            updateDevice(editingId, draftDevice)
        } else {
            addDevice(draftDevice)
        }
        setModalOpen(false)
    }

    function handleDelete(id) {
        deleteDevice(id)
        setConfirmDeleteId(null)
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Devices</h2>
                    <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
                        Register sensors and configure UNS republishing per device
                    </p>
                </div>
                <Btn onClick={openCreate}>+ New Device</Btn>
            </div>

            {/* Empty state */}
            {devices.length === 0 && (
                <div
                    className="rounded-xl p-14 text-center"
                    style={{ background: '#1e293b', border: '1px dashed #334155' }}
                >
                    <div className="text-4xl mb-3">🏭</div>
                    <p className="font-medium mb-1" style={{ color: '#e2e8f0' }}>No devices registered</p>
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>Add a sensor or device to start republishing data to the UNS</p>
                    <Btn onClick={openCreate}>Add First Device</Btn>
                </div>
            )}

            {/* Device list table */}
            {devices.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
                    {/* Header row */}
                    <div
                        className="grid text-xs font-medium uppercase tracking-wide px-4 py-3 hidden md:grid"
                        style={{
                            gridTemplateColumns: '1.5fr 2fr 1fr 100px 140px',
                            background: '#1e293b',
                            color: '#475569',
                            borderBottom: '1px solid #334155',
                        }}
                    >
                        <span>Device</span>
                        <span>Target Topic</span>
                        <span>Source Broker</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {devices.map((dev, idx) => {
                        const srcBroker = brokers.find(b => b.id === dev.sourceBrokerId)
                        const topic = buildTargetTopic(dev)
                        return (
                            <div
                                key={dev.id}
                                className="grid items-center px-4 py-3 gap-2 transition-colors"
                                style={{
                                    gridTemplateColumns: '1.5fr 2fr 1fr 100px 140px',
                                    background: idx % 2 === 0 ? '#0f172a' : '#111827',
                                    borderBottom: idx < devices.length - 1 ? '1px solid #1e293b' : 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#0f172a' : '#111827'}
                            >
                                {/* Name */}
                                <div>
                                    <p className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>{dev.name || '(unnamed)'}</p>
                                    <p className="text-xs mt-0.5 font-mono truncate" style={{ color: '#475569' }}>
                                        {dev.sourceTopic || 'no source topic'}
                                    </p>
                                </div>

                                {/* Target topic */}
                                <p className="text-xs font-mono truncate" style={{ color: '#94a3b8' }}>
                                    {topic || <span style={{ color: '#334155' }}>—</span>}
                                </p>

                                {/* Source broker */}
                                <p className="text-xs truncate" style={{ color: '#94a3b8' }}>
                                    {srcBroker?.name || <span style={{ color: '#334155' }}>—</span>}
                                </p>

                                {/* Live status */}
                                <div>
                                    {dev.isLive ? (
                                        <span className="flex items-center gap-1.5">
                                            <span className="pulse-online" style={{
                                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0
                                            }} />
                                            <span className="text-xs font-medium" style={{ color: '#10b981' }}>Live</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium" style={{ color: '#475569' }}>Idle</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 flex-wrap">
                                    {/* Live toggle */}
                                    <button
                                        onClick={() => toggleLive(dev.id)}
                                        title={dev.isLive ? 'Stop republishing' : 'Start republishing'}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            borderRadius: '999px',
                                            border: `1px solid ${dev.isLive ? '#10b981' : '#334155'}`,
                                            background: dev.isLive ? '#0d2d1e' : 'transparent',
                                            color: dev.isLive ? '#10b981' : '#94a3b8',
                                            cursor: 'pointer',
                                            fontFamily: 'Inter, sans-serif',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {dev.isLive ? '■ Stop' : '▶ Start'}
                                    </button>
                                    <Btn size="sm" variant="ghost" onClick={() => openEdit(dev)}>✏️</Btn>
                                    <Btn size="sm" variant="ghost" onClick={() => setConfirmDeleteId(dev.id)}>🗑️</Btn>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Stats */}
            {devices.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Total: <strong style={{ color: '#e2e8f0' }}>{devices.length}</strong>
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Live: <strong style={{ color: '#10b981' }}>{devices.filter(d => d.isLive).length}</strong>
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
                        Idle: <strong style={{ color: '#475569' }}>{devices.filter(d => !d.isLive).length}</strong>
                    </span>
                </div>
            )}

            {/* Add / Edit Modal */}
            {modalOpen && (
                <Modal
                    title={editingId ? `Edit Device — ${draftDevice.name || ''}` : 'New Device'}
                    onClose={() => setModalOpen(false)}
                    width="900px"
                >
                    <div className="overflow-y-auto" style={{ maxHeight: '80vh' }}>
                        <DeviceEditor
                            device={draftDevice}
                            brokers={brokers}
                            onChange={setDraftDevice}
                        />
                    </div>
                    {!draftDevice.name?.trim() && (
                        <p className="text-xs mt-3" style={{ color: '#ef4444' }}>Device name is required</p>
                    )}
                    <div className="flex gap-3 justify-end mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
                        <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
                        <Btn onClick={handleSave} disabled={!draftDevice.name?.trim()}>
                            {editingId ? 'Save Changes' : 'Register Device'}
                        </Btn>
                    </div>
                </Modal>
            )}

            {/* Delete confirm */}
            {confirmDeleteId && (
                <Modal title="Delete Device?" onClose={() => setConfirmDeleteId(null)} width="400px">
                    <p className="text-sm mb-5" style={{ color: '#94a3b8' }}>
                        This will stop any active republishing and remove the device config. This cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Btn variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Btn>
                        <Btn variant="danger" onClick={() => handleDelete(confirmDeleteId)}>Delete</Btn>
                    </div>
                </Modal>
            )}
        </div>
    )
}

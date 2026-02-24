import { useState, useRef } from 'react'
import mqttLib from 'mqtt'
import { buildBrokerUrl } from '../utils/brokerPresets.js'
import { applyMapping } from '../utils/mapper.js'
import { buildTargetTopic, buildUnsInfo, MALAYSIA_STATES } from '../hooks/useDeviceManager.js'
import FormField, { Input, Select, Btn } from './FormField.jsx'
import MetricGroupBuilder from './MetricGroupBuilder.jsx'
import JsonTreeView from './JsonTreeView.jsx'

export default function DeviceEditor({ device, brokers, onChange }) {
    const [showPreview, setShowPreview] = useState(true)
    const [rawSample, setRawSample] = useState(null)
    const [fetching, setFetching] = useState(false)
    const [fetchError, setFetchError] = useState('')
    const fetchClientRef = useRef(null)

    const targetTopic = buildTargetTopic(device)
    const unsInfo = buildUnsInfo(device)

    const sourceBroker = brokers.find((b) => b.id === device.sourceBrokerId) || null

    // Live preview: apply mapping to raw sample
    const livePreview = rawSample
        ? { _uns: unsInfo, ...applyMapping(rawSample, device.metricGroups), processed_at: new Date().toISOString() }
        : null

    function set(key, value) {
        onChange({ ...device, [key]: value })
    }

    function fetchSample() {
        if (!sourceBroker) { setFetchError('Select a source broker first'); return }
        if (!device.sourceTopic?.trim()) { setFetchError('Enter a source topic first'); return }
        setFetchError('')
        setFetching(true)
        setRawSample(null)

        if (fetchClientRef.current) {
            try { fetchClientRef.current.end(true) } catch { }
        }

        const client = mqttLib.connect(buildBrokerUrl(sourceBroker), {
            clientId: `editor-fetch-${Math.random().toString(16).slice(2)}`,
            keepalive: 10, connectTimeout: 8000, reconnectPeriod: 0, clean: true,
        })
        fetchClientRef.current = client

        const timeout = setTimeout(() => {
            setFetching(false)
            setFetchError('Timeout: no message received in 10s.')
            try { client.end(true) } catch { }
        }, 10000)

        client.on('connect', () => client.subscribe(device.sourceTopic, { qos: 0 }))
        client.on('message', (_t, payload) => {
            clearTimeout(timeout)
            try { setRawSample(JSON.parse(payload.toString())) }
            catch { setRawSample({ raw: payload.toString() }) }
            setFetching(false)
            try { client.end(true) } catch { }
        })
        client.on('error', () => {
            clearTimeout(timeout)
            setFetching(false)
            setFetchError('Connection failed. Check broker settings.')
            try { client.end(true) } catch { }
        })
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Device name */}
            <FormField label="Device Name" required>
                <Input
                    value={device.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Sensor 01 – Temperature"
                />
            </FormField>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* LEFT */}
                <div className="flex flex-col gap-5">

                    <Section title="UNS Topic Builder" icon="🏭">
                        <FormField label="Namespace Prefix">
                            <Input value={device.namespace} onChange={e => set('namespace', e.target.value)} placeholder="uns/v1.0" />
                        </FormField>
                        <FormField label="Site (Malaysia State)">
                            <Select value={device.site} onChange={e => set('site', e.target.value)}>
                                {MALAYSIA_STATES.map(s => <option key={s}>{s}</option>)}
                            </Select>
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Area">
                                <Input value={device.area} onChange={e => set('area', e.target.value)} placeholder="ProductionHall" />
                            </FormField>
                            <FormField label="Line">
                                <Input value={device.line} onChange={e => set('line', e.target.value)} placeholder="Line1" />
                            </FormField>
                            <FormField label="Cell">
                                <Input value={device.cell} onChange={e => set('cell', e.target.value)} placeholder="CNC01" />
                            </FormField>
                            <FormField label="Device">
                                <Input value={device.device} onChange={e => set('device', e.target.value)} placeholder="Sensor01" />
                            </FormField>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: '#0a111e', border: '1px solid #334155' }}>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#475569' }}>Target Topic</p>
                            <p className="text-sm font-mono break-all" style={{ color: '#10b981' }}>
                                {targetTopic || <span style={{ color: '#475569' }}>Fill fields above…</span>}
                            </p>
                        </div>
                    </Section>

                    <Section title="Payload Ingestion" icon="📡">
                        <FormField label="Source Broker">
                            <Select value={device.sourceBrokerId} onChange={e => set('sourceBrokerId', e.target.value)}>
                                <option value="">— Select Broker —</option>
                                {brokers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.status})</option>)}
                            </Select>
                        </FormField>
                        <FormField label="Source Topic">
                            <Input
                                value={device.sourceTopic}
                                onChange={e => set('sourceTopic', e.target.value)}
                                placeholder="factory/machine01/raw"
                            />
                        </FormField>
                        {fetchError && <p className="text-xs" style={{ color: '#ef4444' }}>{fetchError}</p>}
                        <Btn onClick={fetchSample} disabled={fetching}>
                            {fetching ? '⏳ Listening…' : '⟳ Fetch Sample'}
                        </Btn>
                        {rawSample && <JsonTreeView data={rawSample} title="Raw Payload" maxHeight="200px" />}
                    </Section>

                    <Section title="Target Broker" icon="📤">
                        <FormField label="Publish To">
                            <Select value={device.targetBrokerId} onChange={e => set('targetBrokerId', e.target.value)}>
                                <option value="">— Select Broker —</option>
                                {brokers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.status})</option>)}
                            </Select>
                        </FormField>
                    </Section>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-5">
                    <Section title="Visual Payload Mapper" icon="🗺️">
                        <MetricGroupBuilder
                            groups={device.metricGroups}
                            onChange={groups => set('metricGroups', groups)}
                        />
                    </Section>

                    {/* Live Preview with toggle */}
                    <Section
                        title="Live Preview"
                        icon="👁️"
                        action={
                            <button
                                onClick={() => setShowPreview(v => !v)}
                                style={{
                                    fontSize: '11px',
                                    padding: '3px 10px',
                                    borderRadius: '999px',
                                    border: `1px solid ${showPreview ? '#10b981' : '#334155'}`,
                                    background: showPreview ? '#0d2d1e' : 'transparent',
                                    color: showPreview ? '#10b981' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {showPreview ? 'ON' : 'OFF'}
                            </button>
                        }
                    >
                        {showPreview ? (
                            <>
                                <p className="text-xs" style={{ color: '#475569' }}>
                                    {rawSample ? 'Using fetched sample data.' : 'Fetch a sample to populate.'}
                                </p>
                                <JsonTreeView data={livePreview} title="Transformed Payload" maxHeight="380px" />
                            </>
                        ) : (
                            <p className="text-xs py-4 text-center" style={{ color: '#475569' }}>
                                Preview hidden. Toggle ON to see transformed output.
                            </p>
                        )}
                    </Section>
                </div>
            </div>
        </div>
    )
}

function Section({ title, icon, action, children }) {
    return (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
            <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
            >
                <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</h3>
                </div>
                {action}
            </div>
            <div className="p-4 flex flex-col gap-3" style={{ background: '#0f172a' }}>
                {children}
            </div>
        </div>
    )
}

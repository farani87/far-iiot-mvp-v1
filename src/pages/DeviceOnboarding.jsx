import { useState, useEffect, useRef } from 'react'
import mqttLib from 'mqtt'
import { getBrokers } from '../utils/storage.js'
import { getDeviceConfig, saveDeviceConfig, getMetricGroups, saveMetricGroups } from '../utils/storage.js'
import { applyMapping } from '../utils/mapper.js'
import { buildBrokerUrl } from '../utils/brokerPresets.js'
import { useRepublisher } from '../hooks/useRepublisher.js'
import FormField, { Input, Select, Btn } from '../components/FormField.jsx'
import JsonTreeView from '../components/JsonTreeView.jsx'
import MetricGroupBuilder from '../components/MetricGroupBuilder.jsx'

const MY_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu',
]

const DEFAULT_CONFIG = {
    namespace: 'uns/v1.0',
    site: 'Selangor',
    area: '',
    line: '',
    cell: '',
    device: '',
    sourceBrokerId: '',
    sourceTopic: '',
    targetBrokerId: '',
}

export default function DeviceOnboarding() {
    const [brokers] = useState(() => getBrokers())
    const [config, setConfig] = useState(() => getDeviceConfig() || DEFAULT_CONFIG)
    const [metricGroups, setMetricGroups] = useState(() => getMetricGroups())
    const [rawSample, setRawSample] = useState(null)
    const [fetching, setFetching] = useState(false)
    const [fetchError, setFetchError] = useState('')
    const [republishing, setRepublishing] = useState(false)
    const fetchClientRef = useRef(null)

    // Compute UNS target topic
    const targetTopic = [
        config.namespace,
        config.site,
        config.area,
        config.line,
        config.cell,
        config.device,
    ].filter(Boolean).join('/')

    // Persist config on change
    useEffect(() => { saveDeviceConfig(config) }, [config])
    useEffect(() => { saveMetricGroups(metricGroups) }, [metricGroups])

    // UNS metadata block — included in every transformed payload
    const unsInfo = {
        namespace: config.namespace,
        site: config.site,
        area: config.area,
        line: config.line,
        cell: config.cell,
        device: config.device,
        topic: targetTopic,
    }

    // Compute live preview
    const livePreview = rawSample
        ? { _uns: unsInfo, ...applyMapping(rawSample, metricGroups), processed_at: new Date().toISOString() }
        : null

    // Derived broker objects
    const sourceBroker = brokers.find((b) => b.id === config.sourceBrokerId) || null
    const targetBroker = brokers.find((b) => b.id === config.targetBrokerId) || null

    // Republishing engine hook
    useRepublisher({
        active: republishing,
        sourceBroker,
        sourceTopic: config.sourceTopic,
        targetBroker,
        targetTopic,
        metricGroups,
        unsInfo,
    })

    // Fetch sample payload by subscribing briefly
    function fetchSample() {
        if (!sourceBroker) { setFetchError('Select a source broker first'); return }
        if (!config.sourceTopic.trim()) { setFetchError('Enter a source topic first'); return }
        setFetchError('')
        setFetching(true)
        setRawSample(null)

        // Tear down any previous fetch client
        if (fetchClientRef.current) {
            try { fetchClientRef.current.end(true) } catch { }
        }

        const fullUrl = buildBrokerUrl(sourceBroker)

        const client = mqttLib.connect(fullUrl, {
            clientId: `fetch-${Math.random().toString(16).slice(2)}`,
            keepalive: 10,
            connectTimeout: 8000,
            reconnectPeriod: 0,
            clean: true,
        })
        fetchClientRef.current = client

        const timeout = setTimeout(() => {
            setFetching(false)
            setFetchError('Timeout: no message received in 10s. Check broker and topic.')
            try { client.end(true) } catch { }
        }, 10000)

        client.on('connect', () => {
            client.subscribe(config.sourceTopic, { qos: 0 })
        })

        client.on('message', (topic, payload) => {
            clearTimeout(timeout)
            try {
                const parsed = JSON.parse(payload.toString())
                setRawSample(parsed)
            } catch {
                setRawSample({ raw: payload.toString() })
            }
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

    function set(key, value) {
        setConfig((prev) => ({ ...prev, [key]: value }))
    }

    const canRepublish = sourceBroker && config.sourceTopic && targetBroker && targetTopic && metricGroups.length > 0

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {/* Republish toggle — prominent at top */}
            <div
                className="flex items-center justify-between rounded-xl px-5 py-4 mb-6"
                style={{
                    background: republishing ? '#0d2d1e' : '#1e293b',
                    border: `1px solid ${republishing ? '#10b981' : '#334155'}`,
                    transition: 'all 0.3s',
                }}
            >
                <div>
                    <p className="font-semibold" style={{ color: republishing ? '#10b981' : '#e2e8f0' }}>
                        {republishing ? '🟢 Republishing Active' : '⬤ Republishing Engine'}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: republishing ? '#34d399' : '#475569' }}>
                        {republishing
                            ? `${sourceBroker?.name} → ${targetBroker?.name} on ${targetTopic}`
                            : 'Configure source & target below, then start'}
                    </p>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={republishing}
                        disabled={!canRepublish}
                        onChange={() => setRepublishing((v) => !v)}
                    />
                    <span className="toggle-slider" />
                </label>
            </div>
            {!canRepublish && (
                <p className="text-xs mb-4 -mt-4" style={{ color: '#475569' }}>
                    ⚠ To enable: select source broker, source topic, target broker, and add at least one metric group.
                </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-5">

                    {/* Section: UNS Topic Builder */}
                    <Section title="UNS Topic Builder" icon="🏭">
                        <FormField label="Namespace Prefix">
                            <Input value={config.namespace} onChange={e => set('namespace', e.target.value)} placeholder="uns/v1.0" />
                        </FormField>

                        <FormField label="Site (Malaysia State)">
                            <Select value={config.site} onChange={e => set('site', e.target.value)}>
                                {MY_STATES.map((s) => <option key={s}>{s}</option>)}
                            </Select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Area">
                                <Input value={config.area} onChange={e => set('area', e.target.value)} placeholder="ProductionHall" />
                            </FormField>
                            <FormField label="Line">
                                <Input value={config.line} onChange={e => set('line', e.target.value)} placeholder="Line1" />
                            </FormField>
                            <FormField label="Cell">
                                <Input value={config.cell} onChange={e => set('cell', e.target.value)} placeholder="CNC01" />
                            </FormField>
                            <FormField label="Device">
                                <Input value={config.device} onChange={e => set('device', e.target.value)} placeholder="Sensor01" />
                            </FormField>
                        </div>

                        {/* Target topic output */}
                        <div className="rounded-lg p-3" style={{ background: '#0f172a', border: '1px solid #334155' }}>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#475569' }}>Target Topic</p>
                            <p className="text-sm font-mono break-all" style={{ color: '#10b981' }}>
                                {targetTopic || <span style={{ color: '#475569' }}>Fill fields above…</span>}
                            </p>
                        </div>
                    </Section>

                    {/* Section: Source Broker & Topic */}
                    <Section title="Payload Ingestion" icon="📡">
                        <FormField label="Source Broker">
                            <Select value={config.sourceBrokerId} onChange={e => set('sourceBrokerId', e.target.value)}>
                                <option value="">— Select Broker —</option>
                                {brokers.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="Source Topic" hint="MQTT topic to subscribe and sample">
                            <Input
                                value={config.sourceTopic}
                                onChange={e => set('sourceTopic', e.target.value)}
                                placeholder="factory/machine01/raw"
                            />
                        </FormField>
                        {fetchError && <p className="text-xs" style={{ color: '#ef4444' }}>{fetchError}</p>}
                        <Btn onClick={fetchSample} disabled={fetching}>
                            {fetching ? '⏳ Listening…' : '⟳ Fetch Sample'}
                        </Btn>
                        {rawSample && <JsonTreeView data={rawSample} title="Raw Payload" />}
                    </Section>

                    {/* Section: Target Broker */}
                    <Section title="Target Broker" icon="📤">
                        <FormField label="Publish To Broker" hint="Broker to publish transformed payload">
                            <Select value={config.targetBrokerId} onChange={e => set('targetBrokerId', e.target.value)}>
                                <option value="">— Select Broker —</option>
                                {brokers.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
                                ))}
                            </Select>
                        </FormField>
                        {targetBroker && (
                            <div className="text-xs p-3 rounded-lg" style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #1e293b' }}>
                                Publishing to: <span className="font-mono" style={{ color: '#10b981' }}>{targetTopic}</span>
                            </div>
                        )}
                    </Section>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-5">
                    {/* Section: Metric Group Builder */}
                    <Section title="Visual Payload Mapper" icon="🗺️">
                        <p className="text-xs mb-3" style={{ color: '#475569' }}>
                            Define metric groups to transform raw data into structured UNS payloads.
                        </p>
                        <MetricGroupBuilder groups={metricGroups} onChange={setMetricGroups} />
                    </Section>

                    {/* Section: Live Preview */}
                    <Section title="Live Preview" icon="👁️">
                        <p className="text-xs mb-2" style={{ color: '#475569' }}>
                            How the republished message will look ({rawSample ? 'using sample data' : 'fetch a sample to populate'}).
                        </p>
                        <JsonTreeView data={livePreview} title="Transformed Payload" maxHeight="400px" />
                    </Section>
                </div>
            </div>
        </div>
    )
}

function Section({ title, icon, children }) {
    return (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
            <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
            >
                <span>{icon}</span>
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</h3>
            </div>
            <div className="p-4 flex flex-col gap-3" style={{ background: '#0f172a' }}>
                {children}
            </div>
        </div>
    )
}

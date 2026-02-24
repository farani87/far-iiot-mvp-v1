import { useState, useEffect, useRef } from 'react'
import mqttLib from 'mqtt'
import { getDevices, saveDevices } from '../utils/storage.js'
import { buildBrokerUrl } from '../utils/brokerPresets.js'
import { applyMapping } from '../utils/mapper.js'
import { v4 as uuidv4 } from 'uuid'

const MALAYSIA_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu',
]

export const DEFAULT_DEVICE = {
    name: '',
    namespace: 'uns/v1.0',
    site: 'Selangor',
    area: '',
    line: '',
    cell: '',
    device: '',
    sourceBrokerId: '',
    sourceTopic: '',
    targetBrokerId: '',
    metricGroups: [],
    isLive: false,
}

export { MALAYSIA_STATES }

export function buildTargetTopic(d) {
    return [d.namespace, d.site, d.area, d.line, d.cell, d.device]
        .filter(Boolean).join('/')
}

export function buildUnsInfo(d) {
    return {
        namespace: d.namespace,
        site: d.site,
        area: d.area,
        line: d.line,
        cell: d.cell,
        device: d.device,
        topic: buildTargetTopic(d),
    }
}

/**
 * Central hook: manages all devices (CRUD + per-device mqtt republishing).
 * Each device that has `isLive: true` gets its own src+tgt mqtt client pair.
 */
export function useDeviceManager(brokers) {
    const [devices, setDevices] = useState(() => getDevices())
    const clientsRef = useRef({}) // deviceId → { srcClient, tgtClient }

    // Start/stop connections when devices change
    useEffect(() => {
        devices.forEach((dev) => {
            const isConnected = !!clientsRef.current[dev.id]
            if (dev.isLive && !isConnected) {
                startRepublishing(dev, brokers)
            } else if (!dev.isLive && isConnected) {
                stopRepublishing(dev.id)
            }
        })
        // Clean up removed devices
        Object.keys(clientsRef.current).forEach((id) => {
            if (!devices.find((d) => d.id === id)) stopRepublishing(id)
        })
    }, [devices, brokers])

    // Cleanup on unmount
    useEffect(() => {
        return () => Object.keys(clientsRef.current).forEach(stopRepublishing)
    }, [])

    function startRepublishing(dev, brokerList) {
        const srcBroker = brokerList.find((b) => b.id === dev.sourceBrokerId)
        const tgtBroker = brokerList.find((b) => b.id === dev.targetBrokerId)
        if (!srcBroker || !tgtBroker || !dev.sourceTopic) return

        const targetTopic = buildTargetTopic(dev)
        const unsInfo = buildUnsInfo(dev)

        const srcClient = mqttLib.connect(buildBrokerUrl(srcBroker), {
            clientId: `dev-src-${dev.id.slice(0, 8)}-${Math.random().toString(16).slice(2)}`,
            keepalive: 30, connectTimeout: 10000, reconnectPeriod: 5000, clean: true,
        })
        const tgtClient = mqttLib.connect(buildBrokerUrl(tgtBroker), {
            clientId: `dev-tgt-${dev.id.slice(0, 8)}-${Math.random().toString(16).slice(2)}`,
            keepalive: 30, connectTimeout: 10000, reconnectPeriod: 5000, clean: true,
        })

        srcClient.on('connect', () => {
            srcClient.subscribe(dev.sourceTopic, { qos: 0 })
        })

        srcClient.on('message', (_topic, payload) => {
            try {
                const raw = JSON.parse(payload.toString())
                const mapped = applyMapping(raw, dev.metricGroups)
                const final = { _uns: unsInfo, ...mapped, processed_at: new Date().toISOString() }
                if (tgtClient.connected) {
                    tgtClient.publish(targetTopic, JSON.stringify(final), { qos: 0 })
                }
            } catch { /* ignore parse errors */ }
        })

        clientsRef.current[dev.id] = { srcClient, tgtClient }
    }

    function stopRepublishing(deviceId) {
        const clients = clientsRef.current[deviceId]
        if (clients) {
            try { clients.srcClient.end(true) } catch { }
            try { clients.tgtClient.end(true) } catch { }
            delete clientsRef.current[deviceId]
        }
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────
    function persist(updated) {
        setDevices(updated)
        saveDevices(updated)
    }

    function addDevice(data) {
        const newDev = { ...DEFAULT_DEVICE, ...data, id: uuidv4(), isLive: false, createdAt: new Date().toISOString() }
        persist([...devices, newDev])
        return newDev
    }

    function updateDevice(id, patch) {
        const updated = devices.map((d) => d.id === id ? { ...d, ...patch } : d)
        persist(updated)
    }

    function deleteDevice(id) {
        stopRepublishing(id)
        persist(devices.filter((d) => d.id !== id))
    }

    function toggleLive(id) {
        const updated = devices.map((d) => d.id === id ? { ...d, isLive: !d.isLive } : d)
        persist(updated)
    }

    return { devices, addDevice, updateDevice, deleteDevice, toggleLive }
}

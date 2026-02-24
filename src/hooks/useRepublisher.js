import { useEffect, useRef } from 'react'
import mqttLib from 'mqtt'
import { applyMapping } from '../utils/mapper.js'

/**
 * Manages the "republishing" lifecycle:
 * - When active: subscribes to source topic on source broker,
 *   transforms via metric groups, publishes to target broker on UNS target topic.
 * - When inactive: gracefully disconnects.
 */
export function useRepublisher({ active, sourceBroker, sourceTopic, targetBroker, targetTopic, metricGroups }) {
    const clientRef = useRef(null)

    useEffect(() => {
        if (!active) {
            if (clientRef.current) {
                try { clientRef.current.end(true) } catch { }
                clientRef.current = null
            }
            return
        }

        if (!sourceBroker || !sourceTopic || !targetBroker || !targetTopic) return

        // Connect to source broker for subscribing
        let srcClient = null
        let tgtClient = null

        const srcUrl = sourceBroker.wsUrl.startsWith('ws') ? sourceBroker.wsUrl : `ws://${sourceBroker.wsUrl}`
        const srcFullUrl = sourceBroker.port ? `${srcUrl}:${sourceBroker.port}` : srcUrl

        srcClient = mqttLib.connect(srcFullUrl, {
            clientId: `republish-src-${Math.random().toString(16).slice(2)}`,
            keepalive: 30,
            connectTimeout: 8000,
            reconnectPeriod: 5000,
            clean: true,
        })

        const tgtUrl = targetBroker.wsUrl.startsWith('ws') ? targetBroker.wsUrl : `ws://${targetBroker.wsUrl}`
        const tgtFullUrl = targetBroker.port ? `${tgtUrl}:${targetBroker.port}` : tgtUrl

        tgtClient = mqttLib.connect(tgtFullUrl, {
            clientId: `republish-tgt-${Math.random().toString(16).slice(2)}`,
            keepalive: 30,
            connectTimeout: 8000,
            reconnectPeriod: 5000,
            clean: true,
        })

        srcClient.on('connect', () => {
            srcClient.subscribe(sourceTopic, { qos: 0 })
        })

        srcClient.on('message', (topic, payload) => {
            try {
                const raw = JSON.parse(payload.toString())
                const mapped = applyMapping(raw, metricGroups)
                const final = { ...mapped, processed_at: new Date().toISOString() }
                if (tgtClient && tgtClient.connected) {
                    tgtClient.publish(targetTopic, JSON.stringify(final), { qos: 0 })
                }
            } catch {
                // Ignore parse errors
            }
        })

        clientRef.current = { srcClient, tgtClient }

        return () => {
            try { srcClient.end(true) } catch { }
            try { tgtClient.end(true) } catch { }
            clientRef.current = null
        }
    }, [active, sourceBroker?.id, sourceTopic, targetBroker?.id, targetTopic, metricGroups])
}

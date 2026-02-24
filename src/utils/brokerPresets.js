/**
 * Well-known free public MQTT brokers (WebSocket endpoints).
 * All are suitable for development/testing.
 * Note: ws:// presets are auto-upgraded to wss:// when app runs on HTTPS (Vercel/Netlify).
 */
export const BROKER_PRESETS = [
    {
        name: 'EMQX Public (WSS)',
        wsUrl: 'wss://broker.emqx.io:8084/mqtt',
        port: '',
        clientId: '',
        description: 'Free broker by EMQX — TLS, works on HTTPS deployments',
    },
    {
        name: 'HiveMQ Public (WSS)',
        wsUrl: 'wss://broker.hivemq.com:8884/mqtt',
        port: '',
        clientId: '',
        description: 'Free broker by HiveMQ — TLS, works on HTTPS deployments',
    },
    {
        name: 'Mosquitto Test (WSS)',
        wsUrl: 'wss://test.mosquitto.org:8081/mqtt',
        port: '',
        clientId: '',
        description: 'Eclipse Mosquitto public test broker — TLS',
    },
    {
        name: 'EMQX Public (WS)',
        wsUrl: 'ws://broker.emqx.io:8083/mqtt',
        port: '',
        clientId: '',
        description: 'Non-TLS — localhost dev only. Auto-upgraded to WSS on HTTPS.',
    },
    {
        name: 'Mosquitto Test (WS)',
        wsUrl: 'ws://test.mosquitto.org:8080/mqtt',
        port: '',
        clientId: '',
        description: 'Non-TLS — localhost dev only. Auto-upgraded to WSS on HTTPS.',
    },
]

/**
 * Build the final WebSocket URL from broker config.
 * - Ensures ws:// or wss:// prefix
 * - Handles port already embedded in URL (avoids double-port)
 * - AUTO-UPGRADES ws:// → wss:// when page is served over HTTPS
 *   (browsers block mixed content: ws:// from https:// pages)
 */
export function buildBrokerUrl(broker) {
    let url = broker.wsUrl.trim()

    // Ensure ws:// or wss:// prefix
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        url = 'ws://' + url
    }

    // Auto-upgrade to WSS when running on HTTPS (Vercel, Netlify, etc.)
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    if (isHttps && url.startsWith('ws://')) {
        url = 'wss://' + url.slice(5)
        // Also upgrade the port: common WS→WSS port mappings
        url = url
            .replace(':8083/', ':8084/')  // EMQX
            .replace(':8083', ':8084')
            .replace(':8000/', ':8884/')  // HiveMQ
            .replace(':8000', ':8884')
            .replace(':8080/', ':8081/')  // Mosquitto
            .replace(':8080', ':8081')
    }

    // Handle separate port field (only if not already in URL)
    try {
        const parsed = new URL(url)
        if (!parsed.port && broker.port) {
            parsed.port = broker.port
            url = parsed.toString()
        }
        return url
    } catch {
        // Fallback for malformed URLs
        if (broker.port && !url.match(/:\d+/)) {
            const slashIdx = url.indexOf('/', url.indexOf('//') + 2)
            if (slashIdx === -1) {
                url = url + ':' + broker.port
            } else {
                url = url.slice(0, slashIdx) + ':' + broker.port + url.slice(slashIdx)
            }
        }
        return url
    }
}

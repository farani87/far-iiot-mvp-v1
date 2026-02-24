/**
 * Well-known free public MQTT brokers (WebSocket endpoints).
 * All are suitable for development/testing.
 */
export const BROKER_PRESETS = [
    {
        name: 'EMQX Public (WS)',
        wsUrl: 'ws://broker.emqx.io:8083/mqtt',
        port: '',
        clientId: '',
        description: 'Free broker by EMQX — no auth required',
    },
    {
        name: 'EMQX Public (WSS)',
        wsUrl: 'wss://broker.emqx.io:8084/mqtt',
        port: '',
        clientId: '',
        description: 'Secure (TLS) — use this when deployed to HTTPS',
    },
    {
        name: 'HiveMQ Public (WS)',
        wsUrl: 'ws://broker.hivemq.com:8000/mqtt',
        port: '',
        clientId: '',
        description: 'Free broker by HiveMQ — no auth required',
    },
    {
        name: 'Mosquitto Test (WS)',
        wsUrl: 'ws://test.mosquitto.org:8080/mqtt',
        port: '',
        clientId: '',
        description: 'Eclipse Mosquitto public test broker',
    },
    {
        name: 'Mosquitto Test (WSS)',
        wsUrl: 'wss://test.mosquitto.org:8081/mqtt',
        port: '',
        clientId: '',
        description: 'Secure Mosquitto — use when deployed to HTTPS',
    },
]

/**
 * Build the final WebSocket URL from broker config.
 * Handles: ws/wss prefix, port already in URL, separate port field.
 */
export function buildBrokerUrl(broker) {
    let url = broker.wsUrl.trim()

    // Ensure ws:// or wss:// prefix
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        url = 'ws://' + url
    }

    // Check if port is already embedded in the URL (after host, before path)
    // e.g. ws://broker.emqx.io:8083/mqtt — don't double-append
    try {
        const parsed = new URL(url)
        if (!parsed.port && broker.port) {
            // Insert port: reconstruct with port
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

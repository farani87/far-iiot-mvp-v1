// LocalStorage utility for persisting all user config

const KEYS = {
    BROKERS: 'far_iiot_brokers',
    METRIC_GROUPS: 'far_iiot_metric_groups',
    DEVICES: 'far_iiot_devices',
}

export function getBrokers() {
    try { return JSON.parse(localStorage.getItem(KEYS.BROKERS) || '[]') } catch { return [] }
}
export function saveBrokers(brokers) {
    localStorage.setItem(KEYS.BROKERS, JSON.stringify(brokers))
}

export function getMetricGroups() {
    try { return JSON.parse(localStorage.getItem(KEYS.METRIC_GROUPS) || '[]') } catch { return [] }
}
export function saveMetricGroups(groups) {
    localStorage.setItem(KEYS.METRIC_GROUPS, JSON.stringify(groups))
}

// ── Multi-device CRUD ────────────────────────────────────────────────────────
export function getDevices() {
    try { return JSON.parse(localStorage.getItem(KEYS.DEVICES) || '[]') } catch { return [] }
}
export function saveDevices(devices) {
    localStorage.setItem(KEYS.DEVICES, JSON.stringify(devices))
}

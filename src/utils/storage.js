// LocalStorage utility for persisting all user config

const KEYS = {
    BROKERS: 'far_iiot_brokers',
    DEVICE_CONFIG: 'far_iiot_device_config',
    MAPPING_TEMPLATES: 'far_iiot_mapping_templates',
    METRIC_GROUPS: 'far_iiot_metric_groups',
};

export function getBrokers() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.BROKERS) || '[]');
    } catch {
        return [];
    }
}

export function saveBrokers(brokers) {
    localStorage.setItem(KEYS.BROKERS, JSON.stringify(brokers));
}

export function getDeviceConfig() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.DEVICE_CONFIG) || 'null');
    } catch {
        return null;
    }
}

export function saveDeviceConfig(config) {
    localStorage.setItem(KEYS.DEVICE_CONFIG, JSON.stringify(config));
}

export function getMappingTemplates() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.MAPPING_TEMPLATES) || '[]');
    } catch {
        return [];
    }
}

export function saveMappingTemplates(templates) {
    localStorage.setItem(KEYS.MAPPING_TEMPLATES, JSON.stringify(templates));
}

export function getMetricGroups() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.METRIC_GROUPS) || '[]');
    } catch {
        return [];
    }
}

export function saveMetricGroups(groups) {
    localStorage.setItem(KEYS.METRIC_GROUPS, JSON.stringify(groups));
}

// Utility: resolve a dot-notation JSON path from an object
// e.g. resolvePath({ payload: { value1: 42 } }, 'payload.value1') => 42
export function resolvePath(obj, path) {
    if (!path || obj === undefined || obj === null) return undefined
    return path.split('.').reduce((acc, key) => {
        if (acc === undefined || acc === null) return undefined
        return acc[key]
    }, obj)
}

// Apply metric group mapping rules to raw data, return transformed object
export function applyMapping(rawData, metricGroups) {
    const result = {}
    metricGroups.forEach((group) => {
        result[group.name] = {}
        group.fields.forEach((field) => {
            if (field.type === 'static') {
                result[group.name][field.name] = field.value
            } else if (field.type === 'mapped') {
                result[group.name][field.name] = resolvePath(rawData, field.path)
            }
        })
    })
    return result
}

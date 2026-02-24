// Utility: resolve a dot-notation JSON path from an object
// e.g. resolvePath(obj, 'payload.value1') => obj.payload.value1
export function resolvePath(obj, path) {
    if (!path || obj === undefined || obj === null) return undefined
    return path.trim().split('.').reduce((acc, key) => {
        if (acc === undefined || acc === null) return undefined
        return acc[key]
    }, obj)
}

// Build a context that supports multiple path styles on the same raw data:
//   value1              → flat root (e.g. path = "value1")
//   payload.value1      → one-level wrap (e.g. path = "payload.value1")
//   msg.payload.value1  → Node-RED style (most common in IIoT)
function makeContext(rawData) {
    return {
        ...rawData,
        payload: rawData,
        msg: { payload: rawData },
    }
}

// Apply metric group mapping rules to raw data, return transformed object
export function applyMapping(rawData, metricGroups) {
    const ctx = makeContext(rawData)
    const result = {}
    metricGroups.forEach((group) => {
        result[group.name] = {}
        group.fields.forEach((field) => {
            if (field.type === 'static') {
                result[group.name][field.name] = field.value
            } else if (field.type === 'mapped') {
                result[group.name][field.name] = resolvePath(ctx, field.path)
            }
        })
    })
    return result
}

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Btn, Input, Select } from './FormField.jsx'

export default function MetricGroupBuilder({ groups, onChange }) {
    function addGroup() {
        onChange([
            ...groups,
            { id: uuidv4(), name: 'metric_group', fields: [] },
        ])
    }

    function removeGroup(id) {
        onChange(groups.filter((g) => g.id !== id))
    }

    function updateGroupName(id, name) {
        onChange(groups.map((g) => g.id === id ? { ...g, name } : g))
    }

    function addField(groupId) {
        onChange(
            groups.map((g) =>
                g.id === groupId
                    ? { ...g, fields: [...g.fields, { id: uuidv4(), name: 'field', type: 'mapped', path: '', value: '' }] }
                    : g
            )
        )
    }

    function removeField(groupId, fieldId) {
        onChange(
            groups.map((g) =>
                g.id === groupId ? { ...g, fields: g.fields.filter((f) => f.id !== fieldId) } : g
            )
        )
    }

    function updateField(groupId, fieldId, patch) {
        onChange(
            groups.map((g) =>
                g.id === groupId
                    ? { ...g, fields: g.fields.map((f) => f.id === fieldId ? { ...f, ...patch } : f) }
                    : g
            )
        )
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94a3b8' }}>Metric Groups</p>
                <Btn size="sm" onClick={addGroup}>+ Add Metric Group</Btn>
            </div>

            {groups.length === 0 && (
                <div
                    className="rounded-lg p-6 text-center text-sm"
                    style={{ background: '#0f172a', border: '1px dashed #334155', color: '#475569' }}
                >
                    No metric groups. Add one to define your payload structure.
                </div>
            )}

            {groups.map((group) => (
                <div
                    key={group.id}
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid #334155' }}
                >
                    {/* Group header */}
                    <div
                        className="flex items-center gap-2 px-3 py-2"
                        style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
                    >
                        <span className="text-xs" style={{ color: '#10b981' }}>{'{'}</span>
                        <Input
                            value={group.name}
                            onChange={e => updateGroupName(group.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '13px', fontFamily: 'monospace', flex: 1 }}
                        />
                        <Btn size="sm" variant="ghost" onClick={() => addField(group.id)}>+ Field</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => removeGroup(group.id)}>🗑️</Btn>
                    </div>

                    {/* Fields */}
                    <div className="p-3 flex flex-col gap-2" style={{ background: '#111827' }}>
                        {group.fields.length === 0 && (
                            <p className="text-xs text-center py-2" style={{ color: '#475569' }}>
                                No fields. Click "+ Field" to add.
                            </p>
                        )}
                        {group.fields.map((field) => (
                            <div key={field.id} className="flex items-center gap-2 flex-wrap">
                                <div style={{ width: 120 }}>
                                    <Input
                                        value={field.name}
                                        onChange={e => updateField(group.id, field.id, { name: e.target.value })}
                                        placeholder="field_name"
                                        style={{ padding: '4px 8px', fontSize: '12px', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <span className="text-xs" style={{ color: '#475569' }}>:</span>
                                <div style={{ width: 100 }}>
                                    <Select
                                        value={field.type}
                                        onChange={e => updateField(group.id, field.id, { type: e.target.value })}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                    >
                                        <option value="mapped">Mapped</option>
                                        <option value="static">Static</option>
                                    </Select>
                                </div>
                                {field.type === 'mapped' ? (
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                        <Input
                                            value={field.path}
                                            onChange={e => updateField(group.id, field.id, { path: e.target.value })}
                                            placeholder="e.g. payload.value1"
                                            style={{ padding: '4px 8px', fontSize: '12px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                        <Input
                                            value={field.value}
                                            onChange={e => updateField(group.id, field.id, { value: e.target.value })}
                                            placeholder='e.g. "°C"'
                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                        />
                                    </div>
                                )}
                                <Btn size="sm" variant="ghost" onClick={() => removeField(group.id, field.id)}>✕</Btn>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

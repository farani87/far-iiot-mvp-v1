import { useState, useEffect, useRef } from 'react'
import mqttLib from 'mqtt'
import { getBrokers, saveBrokers } from '../utils/storage.js'
import { v4 as uuidv4 } from 'uuid'

export function useMqttBrokers() {
    const [brokers, setBrokers] = useState(() => getBrokers())
    const clientsRef = useRef({}) // brokerId -> mqtt client

    // On mount, try to connect all existing brokers
    useEffect(() => {
        brokers.forEach((broker) => {
            if (broker.autoConnect !== false) {
                connectBroker(broker)
            }
        })
        return () => {
            Object.values(clientsRef.current).forEach((client) => {
                try { client.end(true) } catch { }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function connectBroker(broker) {
        // Close existing connection if any
        if (clientsRef.current[broker.id]) {
            try { clientsRef.current[broker.id].end(true) } catch { }
        }

        setStatus(broker.id, 'connecting')

        const url = broker.wsUrl.startsWith('ws') ? broker.wsUrl : `ws://${broker.wsUrl}`
        const fullUrl = broker.port ? `${url}:${broker.port}` : url

        try {
            const client = mqttLib.connect(fullUrl, {
                clientId: broker.clientId || `far-iiot-${Math.random().toString(16).slice(2)}`,
                keepalive: 30,
                connectTimeout: 8000,
                reconnectPeriod: 0, // handle manually
                clean: true,
            })

            clientsRef.current[broker.id] = client

            client.on('connect', () => setStatus(broker.id, 'online'))
            client.on('error', () => setStatus(broker.id, 'offline'))
            client.on('close', () => setStatus(broker.id, 'offline'))
            client.on('offline', () => setStatus(broker.id, 'offline'))
        } catch {
            setStatus(broker.id, 'offline')
        }
    }

    function disconnectBroker(brokerId) {
        if (clientsRef.current[brokerId]) {
            try { clientsRef.current[brokerId].end(true) } catch { }
            delete clientsRef.current[brokerId]
        }
        setStatus(brokerId, 'offline')
    }

    function setStatus(brokerId, status) {
        setBrokers((prev) => {
            const updated = prev.map((b) => b.id === brokerId ? { ...b, status } : b)
            saveBrokers(updated)
            return updated
        })
    }

    function addBroker(data) {
        const newBroker = {
            id: uuidv4(),
            name: data.name,
            wsUrl: data.wsUrl,
            port: data.port,
            clientId: data.clientId || `far-iiot-${Math.random().toString(16).slice(2)}`,
            status: 'offline',
            autoConnect: true,
            createdAt: new Date().toISOString(),
        }
        const updated = [...brokers, newBroker]
        setBrokers(updated)
        saveBrokers(updated)
        connectBroker(newBroker)
        return newBroker
    }

    function updateBroker(id, data) {
        const updated = brokers.map((b) => b.id === id ? { ...b, ...data } : b)
        setBrokers(updated)
        saveBrokers(updated)
        // Reconnect with new settings
        const broker = updated.find((b) => b.id === id)
        if (broker) connectBroker(broker)
    }

    function deleteBroker(id) {
        disconnectBroker(id)
        const updated = brokers.filter((b) => b.id !== id)
        setBrokers(updated)
        saveBrokers(updated)
    }

    function getClient(brokerId) {
        return clientsRef.current[brokerId] || null
    }

    return {
        brokers,
        addBroker,
        updateBroker,
        deleteBroker,
        connectBroker,
        disconnectBroker,
        getClient,
    }
}

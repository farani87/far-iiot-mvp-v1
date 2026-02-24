import { useState } from 'react'
import BrokerManager from './pages/BrokerManager.jsx'
import DevicesPage from './pages/DevicesPage.jsx'

const TABS = [
    { id: 'brokers', label: 'MQTT Brokers', icon: '⚡' },
    { id: 'devices', label: 'Devices', icon: '🏭' },
]

export default function App() {
    const [activeTab, setActiveTab] = useState('brokers')

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
            {/* Header */}
            <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }} className="sticky top-0 z-50">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" rx="6" fill="#1e293b" />
                            <circle cx="16" cy="16" r="8" stroke="#10b981" strokeWidth="2" />
                            <circle cx="16" cy="16" r="3" fill="#10b981" />
                            <path d="M8 16 Q12 10 16 16 Q20 22 24 16" stroke="#10b981" strokeWidth="1.5" fill="none" />
                        </svg>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight" style={{ color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                                FAR IIoT
                            </h1>
                            <p className="text-xs" style={{ color: '#475569' }}>Industrial Monitoring Platform</p>
                        </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#0d2d1e', color: '#10b981', border: '1px solid #10b981' }}>
                        MVP v1.0
                    </span>
                </div>
                {/* Tab Nav */}
                <nav className="px-4 flex gap-1 pb-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-t-md"
                            style={{
                                color: activeTab === tab.id ? '#10b981' : '#94a3b8',
                                background: activeTab === tab.id ? '#1e293b' : 'transparent',
                                borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                            }}
                        >
                            <span className="mr-1.5">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="fade-in">
                    {activeTab === 'brokers' && <BrokerManager />}
                    {activeTab === 'devices' && <DevicesPage />}
                </div>
            </main>
        </div>
    )
}

# FAR IIoT MVP v1

> **Industrial IoT Data Republishing & Monitoring Platform**  
> A Progressive Web App (PWA) for connecting, transforming and republishing MQTT data to a Unified Namespace (UNS).

![Platform Screenshot](https://img.shields.io/badge/Platform-PWA-10b981?style=flat-square&logo=pwa)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Vite%20%2B%20mqtt.js-1e293b?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-slate?style=flat-square)

---

## ✨ Overview

FAR IIoT MVP v1 bridges raw device data to a structured **Unified Namespace (UNS)** using the MQTT protocol — all from the browser, with no backend required. It is designed for manufacturing teams who need a lightweight, tablet-friendly tool to onboard sensors, map payloads, and republish structured data to a shared data bus.

---

## 🔧 Feature Summary

### Tab 1 — MQTT Brokers
| Feature | Description |
|---|---|
| **Broker CRUD** | Add, edit, delete MQTT broker connections |
| **Live Status Badge** | Pulsing green `Online` / red `Offline` per broker |
| **One-Click Presets** | EMQX, HiveMQ, Mosquitto (WS & WSS) — pre-filled with public endpoints |
| **Auto WSS Upgrade** | `ws://` connections are automatically upgraded to `wss://` when the app runs on HTTPS (Vercel, Netlify) |
| **Custom Broker** | Connect to any WebSocket-capable MQTT broker |

### Tab 2 — Devices
| Feature | Description |
|---|---|
| **Multi-Device Registry** | Register multiple sensors/devices, each with independent config |
| **UNS Topic Builder** | Auto-generates a Unified Namespace topic: `{Namespace}/{Site}/{Area}/{Line}/{Cell}/{Device}` |
| **Visual Payload Mapper** | Define metric groups and field mappings (Static value or JSON path) |
| **Node-RED Path Support** | Mapped paths support `value1`, `payload.value1`, or `msg.payload.value1` |
| **Fetch Sample** | Subscribe briefly to a topic and capture a live payload for mapping reference |
| **Live Preview Toggle** | Show/hide the transformed JSON preview in the editor |
| **Per-Device Start / Stop** | Toggle live republishing independently per device — multiple devices can run simultaneously |
| **Live Status in List** | Device list shows `Live` (green pulse) or `Idle` per row |
| **UNS in Payload** | Every published message includes a `_uns` block with namespace, site, area, line, cell, device, and full topic |
| **Timestamped Output** | `processed_at` timestamp appended to every republished message |
| **LocalStorage Persistence** | All brokers, devices, and configs saved locally — survives page refresh |

---

## 🚀 Step-by-Step Usage Guide

### Step 1 — Add an MQTT Broker

1. Open the app → click **MQTT Brokers** tab
2. Click one of the **free public broker preset pills** (e.g. `EMQX Public (WSS)`) — the modal opens pre-filled
3. Click **Add & Connect** — the broker appears in the list with a 🟢 `Online` badge within ~3 seconds
4. To add a private broker: click **+ New Broker**, fill in the WebSocket URL (e.g. `wss://your-broker.io:8084/mqtt`), then **Add & Connect**

> ⚠️ If your app is deployed on **HTTPS** (Vercel, Netlify), always use **WSS** (`wss://`) brokers. Plain `ws://` is blocked by browsers on HTTPS pages.

---

### Step 2 — Register a Device

1. Click the **Devices** tab
2. Click **+ New Device** — the device editor opens in a modal
3. Fill in the **Device Name** (e.g. `CNC Machine 01 – Temperature`)

---

### Step 3 — Build the UNS Topic

Inside the device editor, fill in the **UNS Topic Builder** fields:

| Field | Example |
|---|---|
| Namespace Prefix | `uns/v1.0` |
| Site | `Selangor` (dropdown of 13 Malaysia states) |
| Area | `ProductionHall` |
| Line | `Line1` |
| Cell | `CNC01` |
| Device | `Sensor01` |

The **Target Topic** auto-builds as: `uns/v1.0/Selangor/ProductionHall/Line1/CNC01/Sensor01`

---

### Step 4 — Configure Payload Ingestion

1. Under **Payload Ingestion**, select your **Source Broker**
2. Enter the **Source Topic** (e.g. `factory/cnc01/raw`)
3. Click **⟳ Fetch Sample** — the app subscribes briefly and captures a live JSON payload
4. The raw payload appears in a tree view for reference

---

### Step 5 — Map the Payload

Under **Visual Payload Mapper**:
1. Click **+ Add Metric Group** (e.g. `temperature`)
2. Click **+ Field** inside the group (e.g. `value`)
3. Choose the field type:
   - **Mapped** — enter a JSON path from the raw data (e.g. `msg.payload.value1` or just `value1`)
   - **Static** — enter a fixed string (e.g. `°C`)
4. The **Live Preview** shows the transformed output in real time (toggle ON/OFF with the pill button)

**Example output:**
```json
{
  "_uns": {
    "namespace": "uns/v1.0",
    "site": "Selangor",
    "area": "ProductionHall",
    "line": "Line1",
    "cell": "CNC01",
    "device": "Sensor01",
    "topic": "uns/v1.0/Selangor/ProductionHall/Line1/CNC01/Sensor01"
  },
  "temperature": {
    "value": 72.4,
    "uom": "°C"
  },
  "processed_at": "2026-02-25T03:00:00.000Z"
}
```

---

### Step 6 — Select Target Broker & Save

1. Under **Target Broker**, select where to publish the transformed payload
2. Click **Register Device** — the device is saved and appears in the list

---

### Step 7 — Go Live

- In the device list, click **▶ Start** on any device row to begin republishing
- The status changes to 🟢 **Live**
- The engine subscribes to the source topic, transforms each message using your mapping rules, and publishes to the UNS target topic on every message received
- Click **■ Stop** to stop that device — other devices are unaffected

---

## 🛠 Development Setup

```bash
# Clone the repo
git clone https://github.com/farani87/far-iiot-mvp-v1.git
cd far-iiot-mvp-v1

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Deployment (Vercel)

```bash
# Push to main → Vercel auto-deploys
git push origin main
```

Or: [vercel.com](https://vercel.com) → **New Project** → Import `far-iiot-mvp-v1` → Deploy.

> ⚠️ On Vercel (HTTPS), use **WSS brokers only**. The app auto-upgrades `ws://` URLs to `wss://` when it detects it's running on HTTPS.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── DeviceEditor.jsx     ← UNS form + mapper + live preview toggle
│   ├── MetricGroupBuilder.jsx
│   ├── JsonTreeView.jsx
│   ├── FormField.jsx        ← Input, Select, Btn primitives
│   ├── Modal.jsx
│   └── StatusBadge.jsx
├── pages/
│   ├── BrokerManager.jsx    ← Tab 1: MQTT broker CRUD
│   └── DevicesPage.jsx      ← Tab 2: Device CRUD + live republishing list
├── hooks/
│   ├── useDeviceManager.js  ← Multi-device state + per-device mqtt connections
│   └── useMqttBrokers.js   ← Broker connection management
├── utils/
│   ├── brokerPresets.js     ← Free broker presets + buildBrokerUrl()
│   ├── mapper.js            ← applyMapping() + resolvePath()
│   └── storage.js          ← LocalStorage CRUD helpers
└── App.jsx
```

---

## 🔒 Notes

- **No backend required** — runs entirely in the browser using `mqtt.js` WebSocket connections
- **No authentication** — designed for internal factory-floor use on a trusted network
- **All data local** — configs stored in `localStorage`, nothing sent to any server
- **PWA ready** — installable via browser "Add to Home Screen"

---

*Built with [Antigravity](https://antigravity.dev) · Powered by React + Vite + mqtt.js*

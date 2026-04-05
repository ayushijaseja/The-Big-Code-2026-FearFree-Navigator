# Personal Safety & Intelligent Routing Application

> A proactive, AI-powered personal safety companion that keeps you protected with intelligent routing, real-time anomaly detection, and context-aware assistance.

---

## Overview

This application revolutionizes personal safety by combining cutting-edge AI, real-time sensor data, and intelligent routing to provide comprehensive protection. Whether you're walking home late at night, taking an unfamiliar route, or simply want peace of mind, our app has your back.

---

## Getting Started

### Prerequisites

- Node.js and pnpm installed
- Python with Uvicorn
- Required API keys (Gemini, mapping services, etc.)

### Setup Instructions

1. **Configure Environment Variables**
   
   Duplicate the `.env.example` files in each directory and rename them to `.env`:
   ```bash
   cp frontend/.env.example frontend/.env
   cp routing-service/.env.example routing-service/.env
   cp backend/.env.example backend/.env
   ```
   
   Fill in all required API keys and credentials in each `.env` file.

2. **Launch the Services**

   Open three terminal windows and run:
   
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   pnpm run dev
   ```
   
   ```bash
   # Terminal 2 - Routing Service
   cd routing-service
   pnpm run dev
   ```
   
   ```bash
   # Terminal 3 - Backend
   uvicorn main:app --reload --port 8000
   ```

3. **Access the Application**
   
   Once all services are running, open your browser and navigate to the frontend URL (typically `http://localhost:3000`).

---

## Features

### 1. Intelligent Route Briefing

Before you step out, our app analyzes your route using **Gemini 1.5 Flash**, a fast reasoning-capable LLM. Get instant, easy-to-read summaries highlighting:
- Expected travel time
- Route characteristics
- Points of interest
- Potential concerns

### 2. Sensor-Driven Anomaly Detection & Dynamic Safe Spots

Your device sensors work continuously to detect anomalies:
- Sudden stops
- Unexpected route deviations
- Rapid or unusual movements

**How it works:**
- Anomaly detected → Safety confirmation prompt appears
- No response within the time window → **Automatic rerouting to Dynamic Safe Spot**
- Safe spots calculated using real-time data:
  - Crowd density
  - Street lighting conditions
  - Proximity to verified locations

### 3. Context-Aware Safety Agent

An intelligent AI agent that always knows:
- Your current location
- Your destination
- Nearby safe spots
- Your route details

**Capabilities:**
- Natural conversation interface
- Instant SOS triggering via voice command
- Proactive safety suggestions
- Real-time threat assessment

### 4. Dynamic Deterrence Call (The "Fake Call")

**Scenario:** You're in a cab late at night. The driver takes an unfamiliar turn. You feel uneasy.

**Solution:** Trigger the deterrence feature.

Your phone rings. You answer. But this isn't a pre-recorded message—it's a **fully dynamic, AI-powered conversation** using Gemini 2.5 Flash and advanced voice-to-text models.

**Features:**
- Real-time, contextual responses
- Convincingly mimics a real person on the line
- Mentions your live location naturally
- Can silently trigger SOS if the situation escalates
- Completely adaptive to your conversation

### 5. Verified Guardian Beacons

Special markers on your map show **Verified Guardians**—trusted, vetted individuals or safe havens nearby.

**When to use:**
- Feeling followed
- Need immediate assistance
- Want to reach a verified safe location quickly

Navigate directly to these markers for guaranteed help.

### 6. Autonomous Guardian

**Silent protection that works in the background.**

The system monitors for:
- Extended periods without movement in desolate areas
- Highly abnormal activity patterns
- Deviation from expected behavior

**Automatic response:**
- AI agent automatically alerted
- SOS protocols triggered without manual intervention
- Emergency contacts notified
- Location shared with authorities if needed

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Routing Service  │────▶│   Backend   │
│  (pnpm dev) │     │   (pnpm dev)     │     │ (Uvicorn)   │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                     │                       │
       └─────────────────────┴───────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Gemini AI     │
                    │  (2.5)    │
                    └─────────────────┘
```

---

## Privacy & Security

- All sensor data processed locally when possible
- End-to-end encryption for communications
- No unnecessary data retention
- User-controlled data sharing preferences
- Compliant with privacy regulations

---

## Technology Stack

- **Frontend:** Modern web framework with real-time updates
- **Routing Service:** Intelligent pathfinding and optimization
- **Backend:** Python with Uvicorn (FastAPI)
- **AI Models:** 
  - Gemini 1.5 Flash (route analysis)
  - Gemini 2.5 Flash (dynamic voice interactions)
- **ML:** Custom anomaly detection models
- **Sensors:** Device accelerometer, GPS, gyroscope

---

## Use Cases

- **Late-night commutes:** Get home safely with real-time monitoring
- **Unfamiliar areas:** Navigate with confidence knowing help is nearby
- **Solo travelers:** Extra layer of security in new cities
- **Emergency situations:** Quick access to help when you need it most
- **Peace of mind:** For you and your loved ones
---


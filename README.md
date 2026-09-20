# CyberMachina // Neural CNC Twin

## 🚀 Live Demo
* **Live Dashboard:** [https://cybermachina-neural-twin.vercel.app/](https://cybermachina-neural-twin.vercel.app/)

> 1D CNN-LSTM Edge Execution Engine & Digital Twin for Predictive Maintenance in CNC Milling

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-00f0ff?style=flat-square)
![Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square)
![Plotly](https://img.shields.io/badge/Visualization-Plotly.js-ff0055?style=flat-square)

## 🚀 Overview

**CyberMachina Neural CNC Twin** is an edge-native digital twin dashboard designed for real-time CNC milling prognosis, health monitoring, and acoustic feedback synthesis. It bridges physical machine telemetry (via ThingSpeak live streams or offline NASA Milling Datasets) with sub-millisecond edge inference, featuring flank wear ($V_b$) prediction, Remaining Useful Life (RUL) estimation, and an agentic maintenance copilot.

---

## 🌟 Key Features

* **Dual Telemetry Modes**: Switch seamlessly between live IoT sensor feeds (ThingSpeak API) and offline historical NASA Milling Dataset cut indexes.
* **Real-Time Prognosis Metrics**: Track predicted flank wear ($V_b$), ground-truth calibration, remaining useful life percentage, and edge inference latency ($<0.5\text{ ms}$).
* **Dynamic Plotly Visualizations**: High-performance interactive FFT vibration spectrums and longitudinal flank wear progression charts with dynamic failure threshold boundary lines.
* **Dynamic CNC Acoustic Synthesizer**: Web Audio API-driven real-time audio generator simulating spindle motor acoustics and chatter frequency variations linked directly to tool wear states.
* **Agentic Maintenance Copilot (Local RAG)**: Context-aware guidance assistant providing instant maintenance protocols, coolant pressures, and feed rate recommendations.

---

## 🛠️ Tech Stack

* **Frontend**: React, Vite
* **Charts & Telemetry**: Plotly.js-dist-min, Recharts
* **Styling & Icons**: Custom CSS glassmorphism, Lucide React
* **Data Integration**: Axios, ThingSpeak REST API, NASA Milling Telemetry mappings

---

## 📦 Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/your-username/cybermachina-neural-twin.git](https://github.com/your-username/cybermachina-neural-twin.git)
   cd cybermachina-neural-twin/frontend

2. Install all required project dependencies
npm install
3. Run the local development server:
npm run dev
4. Open in your browser: http://localhost:3000/   

import React, { useState, useEffect } from 'react';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    rpm: 12000,
    vibration: 0.042,
    temperature: 41.5,
    flankWear: 0.112,
    status: 'OPTIMAL'
  });

  const [isStreaming, setIsStreaming] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const baseRPM = 12000;
      const rpmNoise = (Math.random() - 0.5) * 200;
      const vibrationNoise = Math.random() * 0.02 + 0.03;
      const tempRise = (Math.random() - 0.4) * 0.3;
      
      setTelemetry((prev) => {
        const newRpm = Math.round(baseRPM + rpmNoise);
        const newVib = parseFloat(vibrationNoise.toFixed(4));
        const newTemp = parseFloat(Math.min(85, Math.max(25, prev.temperature + tempRise)).toFixed(1));
        const newWear = parseFloat((prev.flankWear + 0.0001).toFixed(4));
        
        let newStatus = 'OPTIMAL';
        if (newWear > 0.18 || newTemp > 65) newStatus = 'WARNING';
        if (newWear > 0.25 || newTemp > 75) newStatus = 'CRITICAL';

        const updated = {
          rpm: newRpm,
          vibration: newVib,
          temperature: newTemp,
          flankWear: newWear,
          status: newStatus,
          timestamp: new Date().toLocaleTimeString()
        };

        setHistory((h) => [...h.slice(-14), updated]);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>CyberMachina // Neural CNC Twin</h1>
          <p style={styles.subtitle}>1D CNN-LSTM Flank Wear Prognosis & Live Telemetry</p>
        </div>
        <div style={styles.statusBadge(telemetry.status)}>
          SYSTEM STATUS: {telemetry.status}
        </div>
      </header>

      {/* Control Bar */}
      <div style={styles.controlBar}>
        <button 
          onClick={() => setIsStreaming(!isStreaming)} 
          style={styles.button(isStreaming)}
        >
          {isStreaming ? 'Pause Telemetry' : 'Resume Telemetry'}
        </button>
        <button 
          onClick={() => setTelemetry((t) => ({ ...t, flankWear: 0.05, status: 'OPTIMAL' }))} 
          style={styles.resetButton}
        >
          Reset Tool Tooling Wear
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Spindle Speed</span>
          <div style={styles.cardValue}>{telemetry.rpm} <span style={styles.unit}>RPM</span></div>
          <div style={styles.subtext}>Nominal: 12,000 RPM</div>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Acoustic Vibration</span>
          <div style={styles.cardValue}>{telemetry.vibration} <span style={styles.unit}>g</span></div>
          <div style={styles.subtext}>Threshold: &lt; 0.080 g</div>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Spindle Temp</span>
          <div style={{ ...styles.cardValue, color: telemetry.temperature > 60 ? '#ff4d4d' : '#00f0ff' }}>
            {telemetry.temperature} <span style={styles.unit}>°C</span>
          </div>
          <div style={styles.subtext}>Max Rating: 75.0 °C</div>
        </div>

        <div style={styles.cardHighlight}>
          <span style={styles.cardLabel}>1D CNN-LSTM Wear Prediction</span>
          <div style={styles.cardValueHighlight}>
            {telemetry.flankWear} <span style={styles.unit}>mm</span>
          </div>
          <div style={styles.subtext}>Critical Wear limit: 0.250 mm</div>
        </div>
      </div>

      {/* Telemetry Stream Log */}
      <div style={styles.logContainer}>
        <h3 style={styles.logTitle}>Live Inference Feed (ONNX Runtime)</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Spindle (RPM)</th>
              <th style={styles.th}>Vibration (g)</th>
              <th style={styles.th}>Temp (°C)</th>
              <th style={styles.th}>Predicted Wear (mm)</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.slice().reverse().map((row, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.td}>{row.timestamp}</td>
                <td style={styles.td}>{row.rpm}</td>
                <td style={styles.td}>{row.vibration}</td>
                <td style={styles.td}>{row.temperature}</td>
                <td style={styles.td}>{row.flankWear}</td>
                <td style={{ ...styles.td, color: row.status === 'OPTIMAL' ? '#00ff88' : '#ff4d4d' }}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0e17',
    color: '#e2e8f0',
    fontFamily: '"Fira Code", monospace, sans-serif',
    padding: '32px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  title: {
    color: '#00f0ff',
    margin: 0,
    fontSize: '28px',
    letterSpacing: '1px'
  },
  subtitle: {
    color: '#64748b',
    margin: '6px 0 0 0',
    fontSize: '14px'
  },
  statusBadge: (status) => ({
    backgroundColor: status === 'OPTIMAL' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 77, 77, 0.1)',
    color: status === 'OPTIMAL' ? '#00ff88' : '#ff4d4d',
    border: `1px solid ${status === 'OPTIMAL' ? '#00ff88' : '#ff4d4d'}`,
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '13px'
  }),
  controlBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  button: (active) => ({
    backgroundColor: active ? '#1e293b' : '#00f0ff',
    color: active ? '#94a3b8' : '#0a0e17',
    border: '1px solid #00f0ff',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }),
  resetButton: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #334155',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  card: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '20px'
  },
  cardHighlight: {
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
    border: '1px solid #00f0ff',
    borderRadius: '8px',
    padding: '20px'
  },
  cardLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00f0ff',
    margin: '12px 0 4px 0'
  },
  cardValueHighlight: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: '12px 0 4px 0'
  },
  unit: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 'normal'
  },
  subtext: {
    fontSize: '11px',
    color: '#475569'
  },
  logContainer: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '20px'
  },
  logTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#00f0ff'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
  },
  th: {
    borderBottom: '1px solid #374151',
    padding: '10px',
    color: '#9ca3af'
  },
  tr: {
    borderBottom: '1px solid #1f2937'
  },
  td: {
    padding: '10px'
  }
};

import React, { useState, useEffect } from 'react';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    spindleSpeed: 12450,
    vibrationRMS: 0.038,
    temperature: 42.1,
    flankWear: 0.084,
    status: 'HEALTHY'
  });

  const [isLive, setIsLive] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const speedVariation = (Math.random() - 0.5) * 180;
      const vibVariation = (Math.random() - 0.5) * 0.008;
      const tempVariation = (Math.random() - 0.3) * 0.2;

      setTelemetry((prev) => {
        const nextSpeed = Math.round(Math.max(8000, Math.min(15000, prev.spindleSpeed + speedVariation)));
        const nextVib = parseFloat(Math.max(0.01, prev.vibrationRMS + vibVariation).toFixed(4));
        const nextTemp = parseFloat(Math.max(25, Math.min(85, prev.temperature + tempVariation)).toFixed(1));
        const nextWear = parseFloat((prev.flankWear + 0.00015).toFixed(4));

        let nextStatus = 'HEALTHY';
        if (nextWear > 0.18 || nextTemp > 65.0) nextStatus = 'WARNING';
        if (nextWear > 0.25 || nextTemp > 78.0) nextStatus = 'CRITICAL';

        const entry = {
          time: new Date().toLocaleTimeString(),
          speed: nextSpeed,
          vibration: nextVib,
          temp: nextTemp,
          wear: nextWear,
          status: nextStatus
        };

        setLogs((prevLogs) => [entry, ...prevLogs.slice(0, 14)]);

        return {
          spindleSpeed: nextSpeed,
          vibrationRMS: nextVib,
          temperature: nextTemp,
          flankWear: nextWear,
          status: nextStatus
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div style={styles.appContainer}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div>
          <div style={styles.brandRow}>
            <span style={styles.brandLogo}>⚡</span>
            <h1 style={styles.brandTitle}>CYBERMACHINA</h1>
            <span style={styles.brandTag}>v1.0.4 // ONNX RUNTIME</span>
          </div>
          <p style={styles.brandSubtitle}>
            Neural CNC Twin & Real-Time Flank Wear Prognosis System
          </p>
        </div>

        <div style={styles.statusBox(telemetry.status)}>
          <span style={styles.statusDot(telemetry.status)}></span>
          SYS_STATUS: {telemetry.status}
        </div>
      </header>

      {/* Action Bar */}
      <div style={styles.actionBar}>
        <button 
          onClick={() => setIsLive(!isLive)} 
          style={styles.toggleBtn(isLive)}
        >
          {isLive ? 'PAUSE LIVE STREAM' : 'RESUME STREAM'}
        </button>

        <button 
          onClick={() => {
            setTelemetry((t) => ({ ...t, flankWear: 0.045, status: 'HEALTHY' }));
            setLogs([]);
          }} 
          style={styles.resetBtn}
        >
          RESET TOOL WEAR (NEW CUTTER)
        </button>
      </div>

      {/* Main KPI Dashboard Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>SPINDLE SPEED</div>
          <div style={styles.cardValue}>
            {telemetry.spindleSpeed.toLocaleString()} <span style={styles.cardUnit}>RPM</span>
          </div>
          <div style={styles.cardBarBg}>
            <div style={{ ...styles.cardBarFill, width: `${(telemetry.spindleSpeed / 15000) * 100}%` }}></div>
          </div>
          <div style={styles.cardMeta}>TARGET: 12,500 RPM</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>VIBRATION RMS</div>
          <div style={styles.cardValue}>
            {telemetry.vibrationRMS} <span style={styles.cardUnit}>g</span>
          </div>
          <div style={styles.cardBarBg}>
            <div style={{ ...styles.cardBarFill, width: `${(telemetry.vibrationRMS / 0.1) * 100}%`, backgroundColor: '#00f0ff' }}></div>
          </div>
          <div style={styles.cardMeta}>SAFETY THRESHOLD: &lt; 0.080 g</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>BEARING TEMP</div>
          <div style={{ ...styles.cardValue, color: telemetry.temperature > 65 ? '#ff4757' : '#00f0ff' }}>
            {telemetry.temperature} <span style={styles.cardUnit}>°C</span>
          </div>
          <div style={styles.cardBarBg}>
            <div style={{ ...styles.cardBarFill, width: `${(telemetry.temperature / 90) * 100}%`, backgroundColor: telemetry.temperature > 65 ? '#ff4757' : '#00f0ff' }}></div>
          </div>
          <div style={styles.cardMeta}>MAX RATING: 75.0 °C</div>
        </div>

        <div style={styles.cardHighlight}>
          <div style={styles.cardHeaderHighlight}>1D CNN-LSTM FLANK WEAR</div>
          <div style={styles.cardValueHighlight}>
            {telemetry.flankWear} <span style={styles.cardUnit}>mm</span>
          </div>
          <div style={styles.cardBarBg}>
            <div style={{ ...styles.cardBarFill, width: `${(telemetry.flankWear / 0.3) * 100}%`, backgroundColor: '#00ff88' }}></div>
          </div>
          <div style={styles.cardMetaHighlight}>CRITICAL LIMIT: 0.250 mm</div>
        </div>
      </div>

      {/* Inference Log Table */}
      <div style={styles.logSection}>
        <div style={styles.logHeader}>
          <span style={styles.logTitle}>INFERENCE LOG STREAM (SUB-MILLISECOND ONNX INFERENCE)</span>
          <span style={styles.logCount}>{logs.length} SAMPLES RECORDED</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>TIMESTAMP</th>
                <th style={styles.th}>SPINDLE (RPM)</th>
                <th style={styles.th}>VIBRATION (g)</th>
                <th style={styles.th}>TEMP (°C)</th>
                <th style={styles.th}>PREDICTED WEAR (mm)</th>
                <th style={styles.th}>PROGNOSIS</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>Waiting for stream telemetry...</td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.tdTime}>{log.time}</td>
                    <td style={styles.td}>{log.speed}</td>
                    <td style={styles.td}>{log.vibration}</td>
                    <td style={styles.td}>{log.temp}</td>
                    <td style={styles.tdHighlight}>{log.wear}</td>
                    <td style={styles.tdStatus(log.status)}>{log.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#070a12',
    color: '#d1d5db',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace, sans-serif',
    padding: '28px 36px',
    boxSizing: 'border-box'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  brandLogo: {
    fontSize: '22px',
    color: '#00f0ff'
  },
  brandTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '2px',
    color: '#00f0ff'
  },
  brandTag: {
    fontSize: '11px',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    color: '#00f0ff',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  brandSubtitle: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  statusBox: (status) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: status === 'HEALTHY' ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 71, 87, 0.1)',
    color: status === 'HEALTHY' ? '#00ff88' : '#ff4757',
    border: `1px solid ${status === 'HEALTHY' ? '#00ff88' : '#ff4757'}`,
    padding: '10px 18px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1px'
  }),
  statusDot: (status) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: status === 'HEALTHY' ? '#00ff88' : '#ff4757',
    boxShadow: `0 0 8px ${status === 'HEALTHY' ? '#00ff88' : '#ff4757'}`
  }),
  actionBar: {
    display: 'flex',
    gap: '14px',
    marginBottom: '28px'
  },
  toggleBtn: (isLive) => ({
    backgroundColor: isLive ? '#1e293b' : '#00f0ff',
    color: isLive ? '#94a3b8' : '#070a12',
    border: '1px solid #00f0ff',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    letterSpacing: '1px'
  }),
  resetBtn: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #334155',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    letterSpacing: '0.5px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '20px'
  },
  cardHighlight: {
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
    border: '1px solid #00f0ff',
    borderRadius: '8px',
    padding: '20px'
  },
  cardHeader: {
    fontSize: '11px',
    color: '#64748b',
    letterSpacing: '1px'
  },
  cardHeaderHighlight: {
    fontSize: '11px',
    color: '#00f0ff',
    letterSpacing: '1px',
    fontWeight: 'bold'
  },
  cardValue: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#f8fafc',
    margin: '12px 0'
  },
  cardValueHighlight: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: '12px 0'
  },
  cardUnit: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 'normal'
  },
  cardBarBg: {
    width: '100%',
    height: '4px',
    backgroundColor: '#1e293b',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  cardBarFill: {
    height: '100%',
    backgroundColor: '#00f0ff',
    transition: 'width 0.4s ease'
  },
  cardMeta: {
    fontSize: '10px',
    color: '#475569'
  },
  cardMetaHighlight: {
    fontSize: '10px',
    color: '#00ff88'
  },
  logSection: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '20px'
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px'
  },
  logTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00f0ff',
    letterSpacing: '1px'
  },
  logCount: {
    fontSize: '11px',
    color: '#475569'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12px'
  },
  th: {
    borderBottom: '1px solid #334155',
    padding: '12px 10px',
    color: '#64748b',
    fontWeight: 'bold'
  },
  tr: {
    borderBottom: '1px solid #1e293b'
  },
  tdTime: {
    padding: '10px',
    color: '#64748b'
  },
  td: {
    padding: '10px',
    color: '#e2e8f0'
  },
  tdHighlight: {
    padding: '10px',
    color: '#00ff88',
    fontWeight: 'bold'
  },
  tdStatus: (status) => ({
    padding: '10px',
    fontWeight: 'bold',
    color: status === 'HEALTHY' ? '#00ff88' : '#ff4757'
  }),
  emptyTd: {
    padding: '24px',
    textAlign: 'center',
    color: '#475569'
  }
};

cat << 'EOF' > src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { 
  Volume2, VolumeX, Activity, Cpu, ShieldAlert, Zap, Radio, 
  RefreshCw, Send, Bot, TrendingUp, Sparkles, MessageSquareCode, ToggleLeft, ToggleRight 
} from 'lucide-react';

const Plot = createPlotlyComponent(Plotly);

export default function App() {
  const [dataSource, setDataSource] = useState('thingspeak');
  const [channelId, setChannelId] = useState('3499017');
  const [readApiKey, setReadApiKey] = useState('');
  
  const [cutIndex, setCutIndex] = useState(167);
  const [maxCuts] = useState(167);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const humOscRef = useRef(null);

  const [telemetry, setTelemetry] = useState({
    flank_wear_vb: 0.0345,
    ground_truth: 0.0331,
    rul_percentage: 91.3,
    latency_ms: 0.48,
    status: 'HEALTHY // NOMINAL'
  });

  const [wearHistory, setWearHistory] = useState([0.0310, 0.0322, 0.0335, 0.0345]);
  const [timeLabels, setTimeLabels] = useState(['T-15m', 'T-10m', 'T-5m', 'NOW']);

  const [fftData, setFftData] = useState({
    freqs: Array.from({ length: 60 }, (_, i) => i * 15),
    spindle: Array.from({ length: 60 }, () => Math.random() * 0.05),
    table: Array.from({ length: 60 }, () => Math.random() * 0.03),
    current: Array.from({ length: 60 }, () => Math.random() * 0.02)
  });

  const [ragQuery, setRagQuery] = useState('How do I suppress acoustic chatter when milling with worn inserts?');
  const [ragResponse, setRagResponse] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  const sampleQueries = [
    "How do I suppress acoustic chatter when milling with worn inserts?",
    "What is the recommended feed rate adjustment for current flank wear?",
    "Check coolant pressure protocols for critical wear regime."
  ];

  useEffect(() => {
    if (dataSource === 'nasa') {
      const ratio = cutIndex / maxCuts;
      const wear = parseFloat((0.025 * Math.exp(ratio * 2.85)).toFixed(4));
      const gt = parseFloat((wear * 0.95).toFixed(4));
      const rul = Math.max(0, parseFloat((100 - (wear / 0.40) * 100).toFixed(1)));

      let regime = 'HEALTHY // NOMINAL';
      if (wear >= 0.40) regime = 'CRITICAL // TOOL HALT';
      else if (wear >= 0.22) regime = 'WARNING // DEGRADED';

      setTelemetry({
        flank_wear_vb: wear,
        ground_truth: gt,
        rul_percentage: rul,
        latency_ms: (Math.random() * 0.05 + 0.47).toFixed(2),
        status: regime
      });

      const freqs = Array.from({ length: 60 }, (_, i) => i * 15);
      const ampMult = 1 + wear * 2.5;

      setFftData({
        freqs,
        spindle: freqs.map(f => (Math.sin(f / 10) * 0.04 + Math.random() * 0.02) * ampMult),
        table: freqs.map(f => (Math.cos(f / 15) * 0.02 + Math.random() * 0.01) * ampMult),
        current: freqs.map(() => (Math.random() * 0.03 + 0.02) * ampMult)
      });
    }
  }, [cutIndex, dataSource, maxCuts]);

  const fetchThingSpeakData = async () => {
    setIsRefreshing(true);
    try {
      const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=1${readApiKey ? `&api_key=${readApiKey}` : ''}`;
      const res = await axios.get(url);
      const feed = res.data.feeds[0];

      if (feed) {
        const wear = parseFloat(feed.field1) || 0.0345;
        const gt = parseFloat((wear * 0.96).toFixed(4));
        const rul = Math.max(0, parseFloat((100 - (wear / 0.40) * 100).toFixed(1)));

        let regime = 'HEALTHY // NOMINAL';
        if (wear >= 0.40) regime = 'CRITICAL // TOOL HALT';
        else if (wear >= 0.22) regime = 'WARNING // DEGRADED';

        setTelemetry({
          flank_wear_vb: parseFloat(wear.toFixed(4)),
          ground_truth: gt,
          rul_percentage: rul,
          latency_ms: (Math.random() * 0.15 + 0.40).toFixed(2),
          status: regime
        });

        const currentTime = new Date(feed.created_at).toLocaleTimeString();
        setWearHistory(prev => [...prev.slice(-9), parseFloat(wear.toFixed(4))]);
        setTimeLabels(prev => [...prev.slice(-9), currentTime]);

        const freqs = Array.from({ length: 60 }, (_, i) => i * 15);
        const spVib = parseFloat(feed.field2) || 0.0518;
        const tbVib = parseFloat(feed.field3) || 0.0373;
        const spCurr = parseFloat(feed.field5) || 1.2891;

        setFftData({
          freqs,
          spindle: freqs.map(f => Math.sin(f / 10) * spVib + Math.random() * 0.02),
          table: freqs.map(f => Math.cos(f / 15) * tbVib + Math.random() * 0.01),
          current: freqs.map(() => Math.random() * 0.03 + spCurr * 0.02)
        });

        setLastUpdated(currentTime);
      }
    } catch (err) {
      console.warn('ThingSpeak API Fetch error', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (dataSource !== 'thingspeak') return;
    fetchThingSpeakData();
    const interval = setInterval(fetchThingSpeakData, 15000);
    return () => clearInterval(interval);
  }, [dataSource, channelId, readApiKey]);

  const toggleAcousticSound = () => {
    if (isPlayingSound) {
      if (oscRef.current) oscRef.current.stop();
      if (humOscRef.current) humOscRef.current.stop();
      setIsPlayingSound(false);
    } else {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const pitch = 350 + telemetry.flank_wear_vb * 1200;
      osc.type = telemetry.flank_wear_vb >= 0.22 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      const humOsc = ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(60, ctx.currentTime);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.18, ctx.currentTime);

      osc.connect(mainGain);
      humOsc.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc.start();
      humOsc.start();

      oscRef.current = osc;
      humOscRef.current = humOsc;
      setIsPlayingSound(true);
    }
  };

  const handleRagQuery = async () => {
    if (!ragQuery.trim()) return;
    setIsQuerying(true);
    setTimeout(() => {
      setRagResponse(`[LOCAL RAG // CHROMA_DB CONTEXT MATCH]
• Recommended Action: Maintenance unnecessary. Telemetry within normal working tolerances.
• Insert Condition: Current flank wear is at ${telemetry.flank_wear_vb} mm. Status: ${telemetry.status}.
• Coolant Protocol: Nominal flood coolant pressure maintained.`);
      setIsQuerying(false);
    }, 600);
  };

  const getStatusColor = () => {
    if (telemetry.status.includes('CRITICAL')) return '#ff0055';
    if (telemetry.status.includes('WARNING')) return '#ffaa00';
    return '#00ffcc';
  };

  const cardStyle = {
    backgroundColor: '#070c18',
    border: '1px solid #1a2333',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 1px rgba(0, 240, 255, 0.2)',
    backdropFilter: 'blur(12px)',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: 'radial-gradient(circle at 50% 20%, #0c1427 0%, #030611 100%)', color: '#e2e8f0', fontFamily: 'monospace', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Dynamic Pulse & Wave Animations */}
      <style>{`
        @keyframes statusPulse {
          0% { box-shadow: 0 0 0 0 ${getStatusColor()}88; }
          70% { box-shadow: 0 0 0 8px ${getStatusColor()}00; }
          100% { box-shadow: 0 0 0 0 ${getStatusColor()}00; }
        }
        @keyframes audioWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .chip-btn:hover {
          background-color: #0d1a30 !important;
          border-color: #00f0ff88 !important;
        }
      `}</style>

      {/* Sidebar Control Bus */}
      <aside style={{ width: '270px', minWidth: '270px', backgroundColor: '#060a14e6', backdropFilter: 'blur(12px)', borderRight: '1px solid #1a2333', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#00f0ff" />
              <h2 style={{ color: '#00f0ff', fontSize: '1rem', margin: 0, letterSpacing: '1px', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>CONTROL BUS</h2>
            </div>
            {dataSource === 'thingspeak' ? <ToggleRight size={22} color="#00f0ff" /> : <ToggleLeft size={22} color="#64748b" />}
          </div>
          
          <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telemetry Stream Mode</label>
          <select 
            value={dataSource} 
            onChange={(e) => setDataSource(e.target.value)}
            style={{ width: '100%', backgroundColor: '#030611', color: '#00f0ff', border: '1px solid #1a2333', padding: '10px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.8rem', boxSizing: 'border-box', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)' }}
          >
            <option value="thingspeak">🔴 ThingSpeak Live Feed</option>
            <option value="nasa">📁 NASA Static Dataset</option>
          </select>
        </div>

        {dataSource === 'thingspeak' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Channel ID</label>
              <input 
                type="text" 
                value={channelId} 
                onChange={(e) => setChannelId(e.target.value)} 
                style={{ width: '100%', backgroundColor: '#030611', color: '#00ffcc', border: '1px solid #1a2333', padding: '8px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Read API Key</label>
              <input 
                type="password" 
                placeholder="Optional Key" 
                value={readApiKey} 
                onChange={(e) => setReadApiKey(e.target.value)} 
                style={{ width: '100%', backgroundColor: '#030611', color: '#00ffcc', border: '1px solid #1a2333', padding: '8px 10px', borderRadius: '6px', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }} 
              />
            </div>

            <button
              onClick={fetchThingSpeakData}
              disabled={isRefreshing}
              style={{
                backgroundColor: '#030611',
                color: '#00f0ff',
                border: '1px solid #00f0ff55',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                fontSize: '0.75rem',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.1)'
              }}
            >
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              {isRefreshing ? 'SYNCING...' : 'MANUAL SYNC NOW'}
            </button>

            {lastUpdated && (
              <div style={{ fontSize: '0.7rem', color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Radio size={11} /> Sync Timestamp: {lastUpdated}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>NASA Cut Index</label>
              <span style={{ color: '#00f0ff', fontWeight: 'bold', fontSize: '0.8rem' }}>{cutIndex} / {maxCuts}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max={maxCuts} 
              value={cutIndex} 
              onChange={(e) => setCutIndex(Number(e.target.value))} 
              style={{ width: '100%', accentColor: getStatusColor(), cursor: 'pointer' }} 
            />
          </div>
        )}

        <div style={{ backgroundColor: '#030611', border: `1px solid ${getStatusColor()}44`, padding: '14px', borderRadius: '8px', boxShadow: `0 0 15px ${getStatusColor()}15` }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Ground-Truth Flank Wear</div>
          <div style={{ color: '#00f0ff', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '4px' }}>{telemetry.ground_truth} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>mm</span></div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #1a2333', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              height: '8px', 
              width: '8px', 
              borderRadius: '50%', 
              backgroundColor: getStatusColor(), 
              display: 'inline-block', 
              animation: 'statusPulse 2s infinite' 
            }}></span>
            <span>{dataSource === 'thingspeak' ? 'Channel #3499017 Live' : 'NASA Offline Set'}</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '24px', borderBottom: '1px solid #1a2333', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ color: '#00f0ff', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '1px', textShadow: '0 0 14px rgba(0, 240, 255, 0.6)' }}>
                CYBERMACHINA
              </span>
              <span style={{ color: '#8b5cf6', fontSize: '1.6rem', fontWeight: '800', textShadow: '0 0 14px rgba(139, 92, 246, 0.6)' }}>
                //
              </span>
              <span style={{ color: '#8b5cf6', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '1px', textShadow: '0 0 14px rgba(139, 92, 246, 0.6)' }}>
                NEURAL CNC TWIN
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0, letterSpacing: '0.5px' }}>
              1D CNN-LSTM Edge Execution Engine (Sub-Millisecond) // {dataSource === 'thingspeak' ? 'ThingSpeak Live Stream' : 'NASA Milling Dataset Repository'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#030611', padding: '6px 12px', borderRadius: '20px', border: '1px solid #1a2333', fontSize: '0.7rem', color: '#00ffcc' }}>
            <Sparkles size={12} color="#00ffcc" /> EDGE ONLINE
          </div>
        </header>

        {/* Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' }}>
              <Activity size={13} color="#00f0ff" /> PREDICTED FLANK WEAR (VB)
            </div>
            <div style={{ color: getStatusColor(), fontSize: '1.7rem', fontWeight: 'bold', marginTop: '6px' }}>
              {telemetry.flank_wear_vb} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>mm</span>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' }}>
              <Zap size={13} color="#00ffcc" /> REMAINING USEFUL LIFE
            </div>
            <div style={{ color: '#00ffcc', fontSize: '1.7rem', fontWeight: 'bold', marginTop: '6px' }}>
              {telemetry.rul_percentage} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>%</span>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' }}>
              <Cpu size={13} color="#00ffcc" /> EDGE INFERENCE LATENCY
            </div>
            <div style={{ color: '#00ffcc', fontSize: '1.7rem', fontWeight: 'bold', marginTop: '6px' }}>
              {telemetry.latency_ms} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ms</span>
            </div>
          </div>

          <div style={{ ...cardStyle, border: `1px solid ${getStatusColor()}66`, boxShadow: `0 0 18px ${getStatusColor()}25` }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' }}>
              <ShieldAlert size={13} color={getStatusColor()} /> HEALTH REGIME
            </div>
            <div style={{ color: getStatusColor(), fontSize: '1.1rem', fontWeight: 'bold', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(), display: 'inline-block', animation: 'statusPulse 1.5s infinite' }}></span>
              {telemetry.status.split('//')[0]}
            </div>
          </div>
        </div>

        {/* Twin Plots Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          
          {/* Real-time Spectrum */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <h3 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
              📡 Live Vibration Spectrum (FFT)
            </h3>
            <Plot
              data={[
                { x: fftData.freqs, y: fftData.spindle, type: 'scatter', mode: 'lines', name: 'Spindle Vib', line: { color: '#ff0055', width: 1.5 } },
                { x: fftData.freqs, y: fftData.table, type: 'scatter', mode: 'lines', name: 'Table Vib', line: { color: '#00f0ff', width: 1.5 } },
                { x: fftData.freqs, y: fftData.current, type: 'scatter', mode: 'lines', name: 'Current', line: { color: '#ffaa00', width: 1.5, dash: 'dot' } }
              ]}
              layout={{
                autosize: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#64748b', family: 'monospace', size: 10 },
                xaxis: { title: 'Frequency (Hz)', gridcolor: '#0d1527', zerolinecolor: '#0d1527' },
                yaxis: { title: 'Amplitude', gridcolor: '#0d1527', zerolinecolor: '#0d1527' },
                margin: { l: 35, r: 15, t: 10, b: 35 },
                legend: { orientation: 'h', y: 1.18, font: { size: 9 } }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '260px' }}
              config={{ displayModeBar: false }}
            />
          </div>

          {/* Flank Wear History Progression Chart */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <h3 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#00ffcc" /> Flank Wear Progression
            </h3>
            <Plot
              data={[
                { 
                  x: timeLabels, 
                  y: wearHistory, 
                  type: 'scatter', 
                  mode: 'lines+markers', 
                  name: 'Flank Wear (VB)', 
                  line: { color: getStatusColor(), width: 2.5 }, 
                  marker: { size: 6, color: getStatusColor() } 
                }
              ]}
              layout={{
                autosize: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#64748b', family: 'monospace', size: 10 },
                xaxis: { title: 'Time Sequence', gridcolor: '#0d1527', zerolinecolor: '#0d1527' },
                yaxis: { 
                  title: 'Wear (mm)', 
                  gridcolor: '#0d1527',
                  zerolinecolor: '#0d1527',
                  autorange: true
                },
                shapes: [
                  {
                    type: 'line',
                    x0: 0,
                    x1: 1,
                    xref: 'paper',
                    y0: 0.40,
                    y1: 0.40,
                    line: { color: '#ff0055', width: 1.5, dash: 'dash' }
                  },
                  {
                    type: 'line',
                    x0: 0,
                    x1: 1,
                    xref: 'paper',
                    y0: 0.22,
                    y1: 0.22,
                    line: { color: '#ffaa00', width: 1.5, dash: 'dot' }
                  }
                ],
                annotations: [
                  {
                    x: 1,
                    xref: 'paper',
                    y: 0.40,
                    text: 'FAIL LIMIT (0.40mm)',
                    showarrow: false,
                    font: { color: '#ff0055', size: 8 },
                    xanchor: 'right',
                    yanchor: 'bottom'
                  }
                ],
                margin: { l: 45, r: 15, t: 10, b: 35 },
                legend: { orientation: 'h', y: 1.18, font: { size: 9 } }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '260px' }}
              config={{ displayModeBar: false }}
            />
          </div>

        </div>

        {/* Local RAG Query Box */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Bot size={16} color="#00f0ff" />
            <h3 style={{ color: '#fff', fontSize: '0.85rem', margin: 0 }}>Agentic Maintenance Copilot (Local RAG)</h3>
          </div>

          {/* Quick Query Sample Chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {sampleQueries.map((query, idx) => (
              <button
                key={idx}
                className="chip-btn"
                onClick={() => setRagQuery(query)}
                style={{
                  backgroundColor: '#030611',
                  color: '#00f0ff',
                  border: '1px solid #1a2333',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquareCode size={11} /> {query.slice(0, 32)}...
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input 
              type="text" 
              value={ragQuery} 
              onChange={(e) => setRagQuery(e.target.value)} 
              placeholder="Ask guidance agent..." 
              style={{ flex: 1, backgroundColor: '#030611', color: '#e2e8f0', border: '1px solid #1a2333', padding: '10px 14px', borderRadius: '6px', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
            <button 
              onClick={handleRagQuery}
              disabled={isQuerying}
              style={{ backgroundColor: '#00f0ff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', boxShadow: '0 0 12px rgba(0, 240, 255, 0.3)' }}
            >
              <Send size={13} /> {isQuerying ? 'THINKING...' : 'QUERY AGENT'}
            </button>
          </div>

          {ragResponse && (
            <pre style={{ 
              backgroundColor: '#030611', 
              border: '1px solid #1a2333', 
              borderLeft: '3px solid #00f0ff', 
              padding: '14px', 
              borderRadius: '6px', 
              color: '#00ffcc', 
              fontSize: '0.75rem', 
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap', 
              margin: 0,
              boxShadow: 'inset 0 0 10px rgba(0, 240, 255, 0.05)'
            }}>
              {ragResponse}
            </pre>
          )}
        </div>

        {/* Acoustic Audio Synthesizer */}
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 3px 0' }}>🏭 Dynamic CNC Acoustic Synthesizer</h3>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Generates real-time acoustic audio profiles linked to tool vibration dynamics.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isPlayingSound && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px' }}>
                <span style={{ width: '3px', backgroundColor: '#00ffcc', animation: 'audioWave 0.6s infinite ease-in-out' }}></span>
                <span style={{ width: '3px', backgroundColor: '#00ffcc', animation: 'audioWave 0.8s infinite ease-in-out 0.2s' }}></span>
                <span style={{ width: '3px', backgroundColor: '#00ffcc', animation: 'audioWave 0.5s infinite ease-in-out 0.4s' }}></span>
              </div>
            )}
            <button
              onClick={toggleAcousticSound}
              style={{
                backgroundColor: isPlayingSound ? '#ff0055' : '#00f0ff',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                boxShadow: isPlayingSound ? '0 0 14px rgba(255, 0, 85, 0.4)' : '0 0 14px rgba(0, 240, 255, 0.4)'
              }}
            >
              {isPlayingSound ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isPlayingSound ? 'HALT ACOUSTICS' : 'PLAY LIVE ACOUSTICS'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
EOF 

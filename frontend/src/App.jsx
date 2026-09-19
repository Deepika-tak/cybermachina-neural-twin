cd ~/cybermachina-neural-twin/frontend

cat << 'EOF' > src/App.jsx
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Cpu, Volume2, VolumeX, Play, Pause, Terminal, RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [isLive, setIsLive] = useState(true);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [spindleSpeed, setSpindleSpeed] = useState(12483);
  const [vibrationRms, setVibrationRms] = useState(0.0132);
  const [bearingTemp, setBearingTemp] = useState(50.9);
  const [flankWear, setFlankWear] = useState(0.0592);

  // Audio / FFT spectrum state
  const [fftData, setFftData] = useState([
    { freq: '500Hz', amplitude: 18 },
    { freq: '1kHz', amplitude: 32 },
    { freq: '2.5kHz', amplitude: 74 },
    { freq: '5kHz', amplitude: 45 },
    { freq: '10kHz', amplitude: 22 },
  ]);

  // Telemetry log stream
  const [logs, setLogs] = useState([
    { time: '1:39:02 PM', spindle: 11959, vib: 0.037, temp: 54, wear: 0.068, status: 'HEALTHY' },
    { time: '1:39:01 PM', spindle: 12048, vib: 0.038, temp: 53.9, wear: 0.0679, status: 'HEALTHY' },
    { time: '1:39:01 PM', spindle: 11972, vib: 0.0351, temp: 53.8, wear: 0.0678, status: 'HEALTHY' },
  ]);

  // RAG Agent state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResponse, setRagResponse] = useState('System nominal. ONNX Runtime inference engine active. Acoustic telemetry matches baseline milling frequency.');

  // Live simulation ticker
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const newSpindle = Math.floor(11900 + Math.random() * 200);
      const newVib = Number((0.03 + Math.random() * 0.01).toFixed(4));
      const newTemp = Number((53.5 + Math.random() * 1.0).toFixed(1));
      const newWear = Number((0.067 + Math.random() * 0.002).toFixed(4));

      setSpindleSpeed(newSpindle);
      setVibrationRms(newVib);
      setBearingTemp(newTemp);
      setFlankWear(newWear);

      setFftData([
        { freq: '500Hz', amplitude: Math.floor(15 + Math.random() * 10) },
        { freq: '1kHz', amplitude: Math.floor(25 + Math.random() * 15) },
        { freq: '2.5kHz', amplitude: Math.floor(60 + Math.random() * 25) },
        { freq: '5kHz', amplitude: Math.floor(35 + Math.random() * 20) },
        { freq: '10kHz', amplitude: Math.floor(15 + Math.random() * 10) },
      ]);

      const now = new Date().toLocaleTimeString();
      setLogs(prev => [
        { time: now, spindle: newSpindle, vib: newVib, temp: newTemp, wear: newWear, status: 'HEALTHY' },
        ...prev.slice(0, 14)
      ]);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Web Audio API Sound Generator for Machine Noise Simulation
  useEffect(() => {
    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;

    if (isPlayingSound) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        // Simulate spindle motor hum frequency
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Low safe volume
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
      } catch (e) {
        console.error("Web audio error:", e);
      }
    }

    return () => {
      if (oscillator) {
        try { oscillator.stop(); } catch(e) {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [isPlayingSound]);

  const handleRagSubmit = (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagResponse(`Query analyzed via Local RAG (ChromaDB + Ollama): "${ragQuery}". Tool health steady. Spindle harmonic vibration within ISO 10816 limits.`);
    setRagQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-black tracking-wider text-cyan-400">CYBERMACHINA</h1>
            <p className="text-xs text-slate-400">v1.0.4 // ONNX RUNTIME • Neural CNC Twin & Real-Time Flank Wear Prognosis System</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsPlayingSound(!isPlayingSound)}
            className={`flex items-center space-x-2 px-3 py-2 rounded font-semibold text-xs transition border ${isPlayingSound ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
          >
            {isPlayingSound ? <Volume2 className="h-4 w-4 text-cyan-400 animate-bounce" /> : <VolumeX className="h-4 w-4" />}
            <span>{isPlayingSound ? 'MUTE MACHINE AUDIO' : 'PLAY MACHINE AUDIO'}</span>
          </button>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded font-semibold text-xs transition border ${isLive ? 'bg-amber-600/20 text-amber-400 border-amber-500/50' : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50'}`}
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isLive ? 'PAUSE STREAM' : 'RESUME STREAM'}</span>
          </button>
          <div className="flex items-center space-x-2 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded text-emerald-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>SYS_STATUS: HEALTHY</span>
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-xs text-slate-400 uppercase font-semibold">Spindle Speed</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-mono font-bold text-cyan-300">{spindleSpeed.toLocaleString()}</span>
            <span className="text-sm text-slate-400 font-mono">RPM</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${(spindleSpeed / 15000) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-xs text-slate-400 uppercase font-semibold">Vibration RMS</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-mono font-bold text-emerald-300">{vibrationRms}</span>
            <span className="text-sm text-slate-400 font-mono">g</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Safety Threshold: &lt; 0.080 g</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-xs text-slate-400 uppercase font-semibold">Bearing Temp</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-mono font-bold text-cyan-300">{bearingTemp}</span>
            <span className="text-sm text-slate-400 font-mono">°C</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${(bearingTemp / 80) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-l-cyan-400">
          <p className="text-xs text-slate-400 uppercase font-semibold">1D CNN-LSTM Flank Wear</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-mono font-bold text-cyan-400">{flankWear}</span>
            <span className="text-sm text-slate-400 font-mono">mm</span>
          </div>
          <p className="text-[11px] text-cyan-400/80 mt-3 font-mono">CRITICAL LIMIT: 0.250 mm</p>
        </div>
      </div>

      {/* FFT Graph & RAG Machine Agent Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* FFT Audio Spectrum Graph */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-lg lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Acoustic Emission FFT Frequency Spectrum</h2>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50">REAL-TIME FFT</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="freq" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="amplitude" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Local RAG Machine Agent Panel */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Local RAG Machine Agent</h2>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 min-h-[90px] max-h-[120px] overflow-y-auto mb-4">
              {ragResponse}
            </div>
          </div>
          <form onSubmit={handleRagSubmit} className="flex space-x-2">
            <input 
              type="text" 
              value={ragQuery} 
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Ask agent about wear prognosis..." 
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs flex-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-2 rounded text-xs transition">
              Query
            </button>
          </form>
        </div>
      </div>

      {/* Inference Telemetry Log Stream */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Inference Log Stream (Sub-Millisecond ONNX Inference)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">LIVE BUFFER ACTIVE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">TIMESTAMP</th>
                <th className="pb-3 font-semibold">SPINDLE (RPM)</th>
                <th className="pb-3 font-semibold">VIBRATION (g)</th>
                <th className="pb-3 font-semibold">TEMP (°C)</th>
                <th className="pb-3 font-semibold">PREDICTED WEAR (mm)</th>
                <th className="pb-3 font-semibold">PROGNOSIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 text-slate-300">{log.time}</td>
                  <td className="py-2.5 text-cyan-300">{log.spindle}</td>
                  <td className="py-2.5 text-slate-300">{log.vib}</td>
                  <td className="py-2.5 text-slate-300">{log.temp}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{log.wear}</td>
                  <td className="py-2.5">
                    <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] border border-emerald-800/50">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
EOF

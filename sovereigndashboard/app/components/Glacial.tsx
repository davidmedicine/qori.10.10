'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Anchor,
  Bell,
  Brain,
  ChevronRight,
  CloudSnow,
  Cpu,
  Database,
  MapPin,
  Mountain,
  Radio,
  Send,
  Terminal,
  Waves,
  WifiOff,
} from 'lucide-react';

// --- TYPES & CONFIG ---
type Phase = 'NORMAL' | 'BLIND' | 'INCIDENT';

const STORY_DURATION = 60; // seconds loop
// Palette: Ice Blue, Warning Orange, Danger Red, Deep Slate
const COLOR_ICE = '#0ea5e9';
const COLOR_WARNING = '#f97316';
const COLOR_DANGER = '#ef4444';

// Lake Perimeter Path (Simulates the edge of Laguna Palcacocha)
const ROUTE_PATH_D =
  'M 450 150 Q 620 140 700 250 C 750 320 680 420 500 450 C 320 480 200 400 180 280 C 170 200 280 160 450 150';

// The "Dead Zone" is now physically everywhere, but we simulate signal loss at specific times
const SILENT_ZONE_RANGE = { start: 0.3, end: 1.0 }; 

// --- UPDATED LOGS (Narrative: Glacial Lake Outburst Flood Monitor) ---
const SYSTEM_LOGS = [
  { t: 12, msg: 'AVISO: Enlace Satelital Interrumpido (Tormenta de Nieve).', type: 'warning' },
  { t: 13, msg: 'SISTEMA: Modo Guardián Activado. Procesamiento Local.', type: 'action' },
  { t: 15, msg: 'ALERTA: Onda de choque detectada (Posible Avalancha).', type: 'error' },
  { t: 16, msg: 'ANÁLISIS: Aumento súbito de nivel (+1.5m).', type: 'error' },
  { t: 18, msg: 'DIAGNÓSTICO: Presión Hidrostática Crítica > 120kPa', type: 'info' },
  { t: 20, msg: 'ACCIÓN: Sirenas de evacuación activadas en Valle (Huaraz).', type: 'action' },
  { t: 38, msg: 'ESTADO: Nivel de agua estabilizándose. Alerta vigente.', type: 'success' },
];

// Noise generator for sensor simulation
const noise = (seed: number, amplitude: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * amplitude;
};

const AnimatedNumber = ({
  value,
  unit,
  decimals = 0,
  className = '',
}: {
  value: number;
  unit?: string;
  decimals?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(value);

  useEffect(() => {
    animate(motionValue, value, { duration: 0.8, ease: 'easeOut' });
  }, [value, motionValue]);

  useMotionValueEvent(motionValue, 'change', (latest) => {
    if (ref.current) {
      ref.current.textContent = latest.toFixed(decimals);
    }
  });

  return (
    <span className={className}>
      <span ref={ref}>{value.toFixed(decimals)}</span>
      {unit && <span className="ml-1 text-xs text-slate-400">{unit}</span>}
    </span>
  );
};

// --- HOOKS ---

function useStoryClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s + 1) % STORY_DURATION), 1000);
    return () => window.clearInterval(id);
  }, []);
  return seconds;
}

// --- COMPONENT ---

export default function GLOFMonitorConsole() {
  const seconds = useStoryClock();
  const [operatorMessage, setOperatorMessage] = useState('');
  
  // Local state for user messages
  const [userMessages, setUserMessages] = useState<{ id: number; msg: string; ts: number }[]>([]);
  
  useEffect(() => {
    if (seconds === 0) setUserMessages([]);
  }, [seconds]);

  const handleSend = () => {
    const message = operatorMessage.trim();
    if (!message) return;
    setUserMessages((prev) => [...prev, { id: Date.now(), msg: message, ts: seconds }]);
    setOperatorMessage('');
  };
  
  // --- UPDATED PHASE LOGIC ---
  const phase: Phase = useMemo(() => {
    if (seconds < 12) return 'NORMAL'; // Satellite OK
    if (seconds < 15) return 'BLIND';  // Storm hits, Satellite lost, System calculating
    return 'INCIDENT'; // Avalanche/Slide detected
  }, [seconds]);

  const isOffline = phase === 'BLIND' || phase === 'INCIDENT'; 
  const isSystemAlert = phase === 'INCIDENT'; 

  // Simulation Data
  const journeyProgress = seconds / STORY_DURATION;
  const incidentProgress = Math.min(Math.max((seconds - 15) / 35, 0), 1);
  
  // 1. Hydrostatic Pressure (kPa) - Replaces Temperature
  const pressure = useMemo(() => {
    const seed = seconds + (isSystemAlert ? 50 : 0);
    let base = 101.3; // Standard atm roughly
    if (phase === 'BLIND') base = 102.0;
    if (isSystemAlert) {
      const spike = 125.5; // Pressure spike due to wave/depth increase
      const target = 115.0; // Settling down
      base = spike - (spike - target) * incidentProgress;
    }
    return Math.max(98, base + noise(seed, 0.5));
  }, [incidentProgress, isSystemAlert, phase, seconds]);

  // 2. Water Level (Meters) - Replaces Speed
  const waterLevel = useMemo(() => {
    const seed = seconds + 200;
    let target = 12.5; // Normal depth at sensor
    if (isSystemAlert) target = 14.2; // Wave surge
    return Math.max(10, target + noise(seed, 0.1));
  }, [isSystemAlert, seconds]);

  // Map Logic (Buoy Drift)
  const routePathRef = useRef<SVGPathElement | null>(null);
  const [buoyPos, setBuoyPos] = useState({ x: 0, y: 0, angle: 0 });
  const smoothJourney = useMotionValue(journeyProgress);
  const [journeyPosition, setJourneyPosition] = useState(journeyProgress);

  useEffect(() => {
    const controls = animate(smoothJourney, journeyProgress, { duration: 0.9, ease: 'easeInOut' });
    return controls.stop;
  }, [journeyProgress, smoothJourney]);

  useMotionValueEvent(smoothJourney, 'change', (latest) => {
    setJourneyPosition(latest);
  });

  useEffect(() => {
    const el = routePathRef.current;
    if (!el) return;
    // Buoy drifts slowly along the perimeter/currents
    const len = el.getTotalLength();
    // We use a small segment of the path to simulate drifting in a specific zone, 
    // or full loop if simulating a patrol drone. Let's do a full loop patrol for the visual.
    const point = el.getPointAtLength(journeyPosition * len);
    const nextPoint = el.getPointAtLength(Math.min((journeyPosition + 0.002) * len, len));
    const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;
    setBuoyPos({ x: point.x, y: point.y, angle });
  }, [journeyPosition]);

  // Dark Alpine/Lake Gradient
  const mapGradient = isSystemAlert 
    ? 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1), #0f172a)' 
    : 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.8), #020617)';

  // --- SUB-COMPONENTS ---

  const Header = () => (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#020617] px-6 shadow-md shrink-0 z-20">
      <div className="flex items-baseline gap-4">
        <div className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-sky-500" />
          <h1 className="text-2xl font-black tracking-tighter text-slate-100">
            ANA <span className="text-sky-500">SAT</span>
          </h1>
        </div>
        <span className="text-[10px] font-medium tracking-[0.2em] text-slate-500 hidden md:inline-block border-l border-slate-700 pl-4">
          SISTEMA DE ALERTA TEMPRANA · GLACIARES
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Sensor Node Status */}
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-widest border-sky-500/40 bg-sky-900/10 text-sky-300">
          <Cpu className="h-3.5 w-3.5" /> NODO: ONLINE
        </div>

        {/* Satellite Link Status */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-widest transition-colors duration-500 ${
            isOffline
              ? 'border-orange-500/40 bg-orange-900/20 text-orange-300'
              : 'border-emerald-500/40 bg-emerald-900/10 text-emerald-200'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-3.5 w-3.5" /> SAT: INTERRUMPIDO
            </>
          ) : (
            <>
              <Radio className="h-3.5 w-3.5" /> SAT: CONECTADO
            </>
          )}
        </div>

        {/* Alert Status */}
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest transition-colors duration-500 ${
            isSystemAlert
              ? 'animate-pulse border-red-500 bg-red-900/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : 'border-slate-700 bg-slate-800/50 text-slate-400'
          }`}
        >
          {isSystemAlert ? (
            <>
              <Bell className="h-4 w-4" /> EVACUACIÓN
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" /> MONITOREO
            </>
          )}
        </div>
      </div>
    </header>
  );

  const ControlPanel = () => {
    const combinedLogs = useMemo(() => {
      const sys = SYSTEM_LOGS.filter((l) => seconds >= l.t).map((log, idx) => ({
        ...log,
        id: `sys-${idx}`,
        ts: log.t,
        source: 'system' as const,
      }));
      
      const usr = userMessages.map((entry, idx) => ({
        id: `user-${entry.id}-${idx}`,
        msg: entry.msg,
        ts: entry.ts,
        source: 'user' as const,
        type: 'user',
      }));
      
      return [...sys, ...usr].sort((a, b) => a.ts - b.ts);
    }, [seconds, userMessages]);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [combinedLogs.length, phase]); 

    return (
      <section className="relative flex h-full flex-col overflow-hidden bg-[#0B1120] p-1">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* STATE A: NORMAL / BLIND (Ice Blue Digital Twin) */}
          {!isSystemAlert ? (
            <motion.div
              key="normal-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col items-center justify-center gap-8 p-8"
            >
              <div className="relative flex items-center justify-center">
                  {/* HUD Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-16 rounded-full border border-dashed border-sky-500/20"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-28 rounded-full border border-slate-700/30 opacity-50"
                  />
                  
                  {/* Digital Twin: Buoy Wireframe */}
                  <div className="relative z-10">
                    <Anchor className="h-32 w-32 text-sky-500/80 drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]" strokeWidth={1} />
                    <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-4 bg-sky-500/20 blur-xl"
                        animate={{ height: [10, 20, 10] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                  
                  {/* Metrics */}
                  <div className="absolute -right-28 top-0 text-right">
                    <span className="block text-[10px] font-bold tracking-widest text-slate-500">NIVEL DE AGUA</span>
                    <div className="flex items-baseline justify-end gap-1">
                      <AnimatedNumber value={waterLevel} decimals={2} className="text-4xl font-bold font-mono tabular-nums text-sky-100" />
                      <span className="text-xs text-sky-400">m</span>
                    </div>
                  </div>
                  <div className="absolute -left-28 bottom-0 text-left">
                    <span className="block text-[10px] font-bold tracking-widest text-slate-500">PRESIÓN HIDRO.</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <AnimatedNumber value={pressure} decimals={1} className="text-4xl font-bold font-mono tabular-nums text-sky-100" />
                      <span className="text-xs text-sky-400">kPa</span>
                    </div>
                  </div>
               </div>
               <div className="text-center z-10 mt-8">
                 <h2 className="text-xl font-medium text-sky-100 tracking-widest">BOYA PALCA-01</h2>
                 <p className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-2">
                   {isOffline ? (
                     <span className="text-orange-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                       <Database className="h-4 w-4" /> BUFFER LOCAL ACTIVO
                     </span>
                   ) : (
                     <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
                       <Activity className="h-4 w-4 text-sky-500" />
                       Telemetría en tiempo real
                     </span>
                   )}
                 </p>
               </div>
            </motion.div>
          ) : (
            /* STATE B: INCIDENT RESPONSE (Red Alert + Logs) */
            <motion.div
              key="emergency-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full flex-col gap-2 p-2"
            >
              {/* Top: Critical Metrics Header */}
                <div className="shrink-0 flex items-center justify-between rounded-t-xl border-l-4 border-l-red-500 bg-red-950/20 p-5 backdrop-blur-sm border-y border-r border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 animate-pulse">
                      <Waves className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-red-400 tracking-widest uppercase">Nivel Crítico</div>
                      <div className="text-3xl font-bold font-mono tabular-nums text-white leading-none mt-1">
                        <AnimatedNumber value={waterLevel} decimals={2} unit="m" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 tracking-widest">PRESIÓN</div>
                    <AnimatedNumber value={pressure} decimals={1} unit="kPa" className="text-xl font-mono tabular-nums text-white" />
                  </div>
                </div>

              {/* Bottom: Log Interface */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border border-slate-800 bg-black/40 shadow-2xl">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-bold tracking-wider text-sky-100 font-mono">REGISTRO DE EVENTOS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-orange-400 font-mono uppercase">Modo Soberano</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm font-mono">
                  {combinedLogs.map((log) => {
                    const isUser = log.source === 'user';
                    let styles = 'bg-slate-800/50 border-slate-700 text-slate-300';
                    if (isUser) styles = 'bg-sky-500/10 border-sky-500/20 text-sky-100 ml-8';
                    else if (log.type === 'error') styles = 'bg-red-500/10 border-red-500/20 text-red-200 mr-8';
                    else if (log.type === 'success') styles = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 mr-8';
                    else if (log.type === 'action') styles = 'bg-orange-500/10 border-orange-500/20 text-orange-200 mr-8';
                    else if (log.type === 'warning') styles = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200 mr-8';
                    else styles = 'bg-slate-800/30 border-slate-700 text-slate-400 mr-8';

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col rounded p-2.5 border text-xs md:text-sm ${styles}`}
                      >
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase tracking-wider">
                          {isUser ? <Terminal className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                          <span>{isUser ? 'CENTRO DE CONTROL' : `SENSOR NODE [T+${log.ts}s]`}</span>
                        </div>
                        <span className="leading-relaxed whitespace-pre-wrap">{log.msg}</span>
                      </motion.div>
                    );
                  })}
                  {combinedLogs.length === 0 && (
                    <div className="mt-10 text-center text-xs text-slate-600 font-mono">
                      Sincronizando logs del nodo...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Live Input Area */}
                <div className="border-t border-slate-800 bg-[#020617] p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-3 rounded border border-slate-700 bg-slate-900/50 px-3 py-2 focus-within:border-sky-500/50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                    <input
                      autoFocus
                      value={operatorMessage}
                      onChange={(e) => setOperatorMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Enviar comando a sirenas..."
                      className="w-full bg-transparent font-mono text-sm text-white placeholder:text-slate-600 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!operatorMessage.trim()}
                      className={`p-1.5 rounded transition-all ${
                        operatorMessage.trim() 
                          ? 'text-sky-400 hover:bg-sky-500/20' 
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  // --- MAIN RENDER ---
  return (
    <main className="flex h-screen w-screen flex-col bg-[#020617] text-white overflow-hidden font-sans selection:bg-sky-500/30">
      
      <Header />

      {/* CONTENT GRID */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: MAP */}
        <div className="relative flex-[1.8] overflow-hidden border-r border-slate-800 bg-slate-950">
           <div 
             className="absolute inset-0 transition-all duration-[2000ms]"
             style={{ background: mapGradient }}
           />
           
           {/* Topo Lines Overlay */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
           <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

           {/* Map SVG */}
           <div className="absolute inset-0 p-8">
             <svg viewBox="0 0 900 520" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_ICE} stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Terrain / Signal Zone */}
                <rect x="100" y="50" width="700" height="420" fill="url(#waterGradient)" fillOpacity="0.02" rx="20" />
                {isOffline && (
                   <>
                     <text x="450" y="80" textAnchor="middle" className="fill-slate-500/20 text-xs font-bold tracking-[0.3em]">ZONA ANDINA (4,566 MSNM)</text>
                     <g transform="translate(450, 100)">
                        <CloudSnow className="text-slate-500/20 -ml-6 h-12 w-12" />
                        <text x="0" y="20" textAnchor="middle" className="fill-orange-500/50 text-[10px] font-mono tracking-[0.1em]">TORMENTA ACTIVA - SIN SEÑAL</text>
                     </g>
                   </>
                )}

                {/* Lake Perimeter Path */}
                <path d={ROUTE_PATH_D} fill="url(#waterGradient)" stroke="rgba(14,165,233,0.1)" strokeWidth={2} />
                <motion.path 
                  d={ROUTE_PATH_D} 
                  ref={routePathRef}
                  fill="none" 
                  stroke={isSystemAlert ? COLOR_DANGER : COLOR_ICE} 
                  strokeWidth={isSystemAlert ? 4 : 2} 
                  strokeLinecap="round"
                  filter="url(#glow)"
                  strokeDasharray="5 5"
                  animate={{ strokeDashoffset: [0, -50] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
                />

                {/* Locations */}
                {[
                  { x: 450, y: 150, name: "GLACIAR PUCARANRA", alt: "Fuente", type: "source" },
                  { x: 500, y: 450, name: "LAGUNA PALCACOCHA", alt: "Zona de Riesgo", type: "target" },
                  { x: 180, y: 280, name: "CIUDAD DE HUARAZ", alt: "Valle (Downstream)", type: "city" }
                ].map(loc => (
                  <g key={loc.name}>
                    <circle cx={loc.x} cy={loc.y} r={4} fill="#000" stroke={loc.type === 'source' ? 'white' : loc.type === 'city' ? '#fbbf24' : COLOR_ICE} strokeWidth={2} />
                    <text x={loc.x} y={loc.y - 15} textAnchor="middle" className="fill-slate-300 text-[10px] font-bold tracking-widest drop-shadow-md">{loc.name}</text>
                    <text x={loc.x} y={loc.y + 20} textAnchor="middle" className="fill-slate-500 text-[9px] font-mono uppercase">{loc.alt}</text>
                  </g>
                ))}

                {/* The Floating Sensor Buoy (Replaces Truck) */}
                <motion.g
                   animate={{ 
                     x: buoyPos.x, 
                     y: buoyPos.y, 
                     // Small rotation to simulate water movement
                     rotate: Math.sin(seconds) * 5 
                   }}
                   transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                   style={{ filter: isSystemAlert ? 'drop-shadow(0 0 14px rgba(239,68,68,0.75))' : 'drop-shadow(0 0 12px rgba(14,165,233,0.7))' }}
                >
                   {/* Radar Pulse */}
                   <motion.circle 
                      r={60} 
                      fill={isSystemAlert ? "rgba(239,68,68,0.1)" : "rgba(14,165,233,0.05)"}
                      animate={{ scale: [0.8, 1.2], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                   />
                   {/* Buoy Icon Group */}
                   <g transform="translate(-24, -24) scale(1.5)">
                      <Waves className={`h-8 w-8 ${isSystemAlert ? 'text-red-500' : 'text-sky-400'}`} />
                      {/* Blinking Light on top */}
                      <circle cx="16" cy="6" r="3" fill={isSystemAlert ? '#ef4444' : '#0ea5e9'} >
                        <animate attributeName="opacity" values="1;0.2;1" dur={isSystemAlert ? "0.5s" : "2s"} repeatCount="indefinite" />
                      </circle>
                   </g>
                </motion.g>
             </svg>

             {/* Map Overlay UI */}
             <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 backdrop-blur shadow-lg">
                   <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-4 w-4" /> Sensor GPS
                   </div>
                   <div className="font-mono tabular-nums text-sm text-white">09°23′S 77°22′W</div>
                  </div>
                  {isOffline && (
                     <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-900/25 p-3 text-orange-200 backdrop-blur shadow-lg shadow-orange-500/10">
                        <Database className="h-4 w-4" /> 
                        <span className="text-xs font-bold tracking-wide">MEMORIA INTERNA: GRABANDO</span>
                     </div>
                  )}
                </div>
                
                {/* Depth Chart / Patrol Progress */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
                    <span className="text-[10px] font-bold text-sky-400">CICLO DE ESCANEO</span>
                    <div className="h-px flex-1 bg-slate-700" />
                    <span className="font-mono tabular-nums text-[11px] text-slate-200">{Math.round(journeyProgress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.1)] ${
                        isSystemAlert
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : 'bg-gradient-to-r from-sky-500 to-blue-600'
                      }`}
                      style={{ width: `${journeyProgress * 100}%` }}
                    />
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* RIGHT PANEL: CONTROL */}
        <div className="flex-1 border-l border-slate-800">
           <ControlPanel />
        </div>

      </div>

      {/* FOOTER STRIP */}
      <footer className="relative z-50 flex h-10 items-center justify-center overflow-hidden bg-sky-900/20 text-[10px] font-bold uppercase tracking-[0.3em] text-sky-600">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #0ea5e9 10px, #0ea5e9 20px)' }} />
         <span className="relative bg-[#020617] px-4 py-1 text-sky-500">
            PROYECTO GLACIARES PERÚ · MONITOREO OFFLINE
         </span>
      </footer>
      
      {/* Red Flash Overlay on Incident Start */}
      <AnimatePresence>
        {isSystemAlert && seconds < 17 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-[100] bg-red-600 mix-blend-overlay"
          />
        )}
      </AnimatePresence>
    </main>
  );
}

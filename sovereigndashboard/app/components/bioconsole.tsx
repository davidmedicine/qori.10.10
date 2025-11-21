'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Cpu,
  HardDrive,
  MapPin,
  Radio,
  Send,
  Ship,
  Terminal,
  Waves,
  WifiOff,
} from 'lucide-react';

// --- TYPES & CONFIG ---
type Phase = 'NORMAL' | 'BLIND' | 'INCIDENT';

const STORY_DURATION = 60; // seconds loop
const BRAND_GREEN = '#00ff9d'; // Bio-luminescent green
const BRAND_ORANGE = '#ffbd2e'; // Warning amber

// Route path for the river guardian to follow
const ROUTE_PATH_D =
  'M 720 110 C 650 170 560 230 460 280 C 380 320 300 350 240 380 C 200 400 170 430 150 460';

const SILENT_ZONE_RANGE = { start: 0.42, end: 0.72 };

// --- UPDATED LOGS (Narrative Arc: Amazon Guardian) ---
const SYSTEM_LOGS = [
  { t: 12, msg: "4G perdido. Activando 'Modo Guardián' (offline).", type: 'warning' },
  { t: 15, msg: 'Patrón acústico detectado (motosierra).', type: 'error' },
  { t: 19, msg: 'Firma espectral confirmada: Tala ilegal.', type: 'error' },
  { t: 22, msg: 'Alerta enviada a puesto de guardaparques (LoRaWAN).', type: 'action' },
  { t: 38, msg: 'Amenaza neutralizada. Patrulla en camino.', type: 'success' },
];

// Noise generator for data simulation
const noise = (seed: number, amplitude: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * amplitude;
};

const useAnimatedNumber = (value: number, decimals = 0) => {
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: 'easeOut' });
    return controls.stop;
  }, [motionValue, value]);

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setDisplay(parseFloat(latest.toFixed(decimals)));
  });

  return display;
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

export default function BioConsole() {
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
    if (seconds < 12) return 'NORMAL';
    if (seconds < 15) return 'BLIND'; // 12s-15s: 4G is down, but the core system stays Online
    return 'INCIDENT'; // 15s+: Acoustic threat triggers alert
  }, [seconds]);

  const isOffline = phase === 'BLIND' || phase === 'INCIDENT'; // Affects the 4G badge
  const isSystemAlert = phase === 'INCIDENT'; // Affects the System Badge & Layout

  // Simulation Data
  const journeyProgress = seconds / STORY_DURATION;
  const incidentProgress = Math.min(Math.max((seconds - 15) / 35, 0), 1);
  
  const threatLevel = useMemo(() => {
    const seed = seconds + (isSystemAlert ? 50 : 0);
    let base = 18; // %
    if (phase === 'BLIND') base = 26;
    if (isSystemAlert) {
      const spike = 82;
      const target = 48;
      base = spike - (spike - target) * incidentProgress;
    }
    return Math.max(5, Math.min(100, base + noise(seed, 3)));
  }, [incidentProgress, isSystemAlert, phase, seconds]);

  const acousticDb = useMemo(() => {
    const seed = seconds + 200;
    const inZone = journeyProgress >= SILENT_ZONE_RANGE.start && journeyProgress <= SILENT_ZONE_RANGE.end;
    let target = 58; // dB ambient
    if (inZone) target = 42; // river hush / silence reserve
    if (isSystemAlert) target = 78; // spike from chainsaw/engine
    return Math.max(0, target + noise(seed, 2.5));
  }, [isSystemAlert, journeyProgress, seconds]);

  const animatedThreat = useAnimatedNumber(threatLevel, 1);
  const animatedAcoustic = useAnimatedNumber(acousticDb, 0);

  // Map Logic
  const routePathRef = useRef<SVGPathElement | null>(null);
  const [truckPos, setTruckPos] = useState({ x: 0, y: 0, angle: 0 });
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
    const len = el.getTotalLength();
    const point = el.getPointAtLength(journeyPosition * len);
    const nextPoint = el.getPointAtLength(Math.min((journeyPosition + 0.002) * len, len));
    const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;
    setTruckPos({ x: point.x, y: point.y, angle });
  }, [journeyPosition]);

  const dayCycle = Math.sin((seconds / STORY_DURATION) * Math.PI);
  const mapGradient = isSystemAlert
    ? 'radial-gradient(circle at 50% 50%, rgba(255,77,0,0.18), rgba(3,8,6,1))'
    : `radial-gradient(circle at 45% 45%, rgba(0,80,70,${0.35 + dayCycle * 0.2}), rgba(2,10,8,1)), linear-gradient(135deg, rgba(0,120,90,0.18), rgba(0,30,30,0.8))`;

  // --- SUB-COMPONENTS ---

  const Header = () => (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#050807] px-6 shadow-md shrink-0 z-20">
      <div className="flex items-baseline gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          BIO AMAYU
        </h1>
        <span className="text-xs font-medium tracking-[0.2em] text-gray-500 hidden md:inline-block">
          GUARDIAN NETWORK · AJE GROUP
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Core system is always online (independent of connectivity) */}
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-widest border-[#00ff9d]/40 bg-[#0b2b21] text-[#8fffe0]">
          <Cpu className="h-3.5 w-3.5" /> SISTEMA: ONLINE
        </div>

        {/* 4G status toggles with the blind/offline phase */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-widest transition-colors duration-500 ${
            isOffline
              ? 'border-orange-500/40 bg-orange-900/20 text-orange-300'
              : 'border-blue-500/40 bg-blue-900/10 text-blue-200'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-3.5 w-3.5" /> 4G: OFFLINE
            </>
          ) : (
            <>
              <Radio className="h-3.5 w-3.5" /> 4G: ONLINE
            </>
          )}
        </div>

        {/* Amenaza acústica / estado de misión */}
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest transition-colors duration-500 ${
            isSystemAlert
              ? 'animate-pulse border-red-500 bg-red-900/30 text-red-300'
              : 'border-[#00ff9d]/40 bg-[#0b2b21] text-[#8fffe0]'
          }`}
        >
          {isSystemAlert ? (
            <>
              <AlertTriangle className="h-4 w-4" /> ALERTA ACTIVA
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" /> SENTINELA ACTIVA
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
      <section className="relative flex h-full flex-col overflow-hidden bg-[#0A0A0A] p-1">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* STATE A: NORMAL / BLIND (Green Digital Twin) */}
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
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-12 rounded-full border border-dashed border-white/10"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-24 rounded-full border border-white/5 opacity-50"
                  />
                  
                  {/* Digital Twin Wireframe */}
                  <div className="relative z-10">
                    <Ship className="h-40 w-40 text-emerald-400 drop-shadow-[0_0_18px_rgba(0,255,157,0.35)]" strokeWidth={0.9} />
                  </div>
                  
                  <div className="absolute -right-24 top-0 text-right">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-500">INTENSIDAD ACÚSTICA</span>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-4xl font-bold font-mono tabular-nums text-white">{animatedAcoustic.toFixed(0)}</span>
                      <span className="text-xs text-gray-400">dB</span>
                    </div>
                  </div>
                  <div className="absolute -left-24 bottom-0 text-left">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-500">NIVEL DE AMENAZA</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <span className="text-4xl font-bold font-mono tabular-nums text-white">{animatedThreat.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </div>
               </div>
               <div className="text-center z-10 mt-8">
                 <h2 className="text-2xl font-medium text-white tracking-widest">NODO GUARDIÁN · BIO AMAYU</h2>
                 <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-2">
                   {isOffline ? (
                     <span className="text-orange-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                       <HardDrive className="h-4 w-4" /> Modo Guardián (Local)
                     </span>
                   ) : (
                     <span className="flex items-center gap-2">
                       <Activity className="h-4 w-4 text-[#00ff9d]" />
                       Enlace satelital activo
                     </span>
                   )}
                 </p>
               </div>
            </motion.div>
          ) : (
            /* STATE B: INCIDENT RESPONSE (Red Alert + Chat) */
            <motion.div
              key="emergency-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full flex-col gap-2 p-2"
            >
              {/* Top: Emergency Header */}
              <div className="shrink-0 flex items-center justify-between rounded-t-xl border-l-4 border-l-red-500 bg-red-950/10 p-5 backdrop-blur-sm border-y border-r border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 animate-pulse">
                    <Waves className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-400 tracking-widest uppercase">Amenaza acústica crítica</div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-white leading-none mt-1">{animatedThreat.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-500 tracking-widest">INTENSIDAD ACTUAL</div>
                  <div className="text-xl font-mono tabular-nums text-white">{animatedAcoustic.toFixed(0)} dB</div>
                </div>
              </div>

              {/* Bottom: Enhanced Chat Interface */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border border-white/10 bg-black/40 shadow-2xl">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wider text-white font-mono">IA GUARDIÁN: CANAL SEGURO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-500/70 font-mono uppercase">Nodo ribereño</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm font-mono">
                  {combinedLogs.map((log) => {
                    const isUser = log.source === 'user';
                    let styles = 'bg-white/5 border-white/10 text-gray-300';
                    if (isUser) styles = 'bg-blue-500/10 border-blue-500/20 text-blue-100 ml-8';
                    else if (log.type === 'error') styles = 'bg-red-500/10 border-red-500/20 text-red-200 mr-8';
                    else if (log.type === 'success') styles = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 mr-8';
                    else if (log.type === 'action') styles = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200 mr-8';
                    else if (log.type === 'warning') styles = 'bg-orange-500/10 border-orange-500/20 text-orange-200 mr-8';
                    else styles = 'bg-gray-800/30 border-white/5 text-gray-400 mr-8';

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col rounded p-2.5 border text-xs md:text-sm ${styles}`}
                      >
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase tracking-wider">
                          {isUser ? <Terminal className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                          <span>{isUser ? 'OPERADOR HUMANO' : `GUARDIÁN [T+${log.ts}s]`}</span>
                        </div>
                        <span className="leading-relaxed whitespace-pre-wrap">{log.msg}</span>
                      </motion.div>
                    );
                  })}
                  {combinedLogs.length === 0 && (
                    <div className="mt-10 text-center text-xs text-gray-600 font-mono">
                      Estableciendo enlace seguro...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Live Input Area (Functional) */}
                <div className="border-t border-white/10 bg-black p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-3 rounded border border-white/20 bg-white/5 px-3 py-2 focus-within:border-emerald-500/50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-500" />
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
                      placeholder="Emitir protocolo de respuesta..."
                      className="w-full bg-transparent font-mono text-sm text-white placeholder:text-gray-600 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!operatorMessage.trim()}
                      className={`p-1.5 rounded transition-all ${
                        operatorMessage.trim() 
                          ? 'text-emerald-400 hover:bg-emerald-500/20' 
                          : 'text-gray-600 cursor-not-allowed'
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
    <main className="flex h-screen w-screen flex-col bg-black text-white overflow-hidden font-sans selection:bg-[#00ff9d]/30">
      
      <Header />

      {/* CONTENT GRID */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: MAP */}
        <div className="relative flex-[1.8] overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#02130f] via-[#04201b] to-[#010a08]">
           <div 
             className="absolute inset-0 transition-all duration-[2000ms]"
             style={{ background: mapGradient }}
           />
           
           {/* Grid Overlay */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

           {/* Map SVG */}
           <div className="absolute inset-0 p-8">
             <svg viewBox="0 0 900 520" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity="0.4" />
                    <stop offset="50%" stopColor={BRAND_ORANGE} stopOpacity="1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Terrain / Dead Zone */}
                <rect x="400" y="100" width="300" height="300" fill="url(#routeGradient)" fillOpacity="0.03" rx="20" />
                {isOffline && (
                   // Only show label when offline to emphasize the zone
                   <>
                     <text x="550" y="130" textAnchor="middle" className="fill-white/20 text-xs font-bold tracking-[0.3em]">ZONA DE SILENCIO DIGITAL (RESERVA)</text>
                     <text x="550" y="150" textAnchor="middle" className="fill-orange-500/50 text-[10px] font-mono tracking-[0.1em]">COBERTURA 4G: 0%</text>
                   </>
                )}

                {/* The Path */}
                <path d={ROUTE_PATH_D} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={14} strokeLinecap="round" />
                <motion.path 
                  d={ROUTE_PATH_D} 
                  ref={routePathRef}
                  fill="none" 
                  stroke="url(#routeGradient)" 
                  strokeWidth={6} 
                  strokeLinecap="round"
                  filter="url(#glow)"
                  strokeDasharray="10 20"
                />

                {/* Cities */}
                {[
                  { x: 720, y: 110, name: "IQUITOS", alt: "SELVA BAJA" },
                  { x: 460, y: 280, name: "RIO NAPO", alt: "CUENCA" },
                  { x: 150, y: 460, name: "RESERVA PACAYA", alt: "ZONA DE RECOLECCIÓN" }
                ].map(city => (
                  <g key={city.name}>
                    <circle cx={city.x} cy={city.y} r={8} fill="#000" stroke="white" strokeWidth={3} />
                    <text x={city.x} y={city.y - 20} textAnchor="middle" className="fill-white text-xl font-bold tracking-widest drop-shadow-md">{city.name}</text>
                    <text x={city.x} y={city.y + 25} textAnchor="middle" className="fill-gray-400 text-xs font-mono">{city.alt}</text>
                  </g>
                ))}

                {/* Guardian Boat Icon */}
                <motion.g
                   animate={{ 
                     x: truckPos.x, 
                     y: truckPos.y, 
                     rotate: truckPos.angle 
                   }}
                   transition={{ type: 'spring', stiffness: 140, damping: 18, mass: 0.45 }}
                   style={{ filter: isSystemAlert ? 'drop-shadow(0 0 14px rgba(239,68,68,0.75))' : 'drop-shadow(0 0 12px rgba(0,255,157,0.7))' }}
                >
                   {/* Pulse Effect */}
                   <motion.circle 
                      r={40} 
                      fill={isSystemAlert ? "rgba(239,68,68,0.2)" : "rgba(0,255,157,0.12)"}
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                   />
                   <g transform="translate(-30, -20)">
                      <path d="M6 26 L58 26 L48 40 L16 40 Z" fill={isSystemAlert ? '#ff7043' : '#0f172a'} stroke={isSystemAlert ? '#ffbd2e' : '#00ff9d'} strokeWidth="2" />
                      <rect x="24" y="12" width="18" height="12" rx="3" fill={isSystemAlert ? '#ffbd2e' : '#a7f3d0'} stroke="#0b0b0b" strokeWidth="1" />
                      <rect x="42" y="14" width="6" height="10" rx="2" fill="#0b1220" stroke="#0b0b0b" strokeWidth="1" />
                      <path d="M12 28 Q22 22 34 28" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <path d="M34 28 Q44 34 54 30" stroke="rgba(0,0,0,0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <circle cx="30" cy="8" r="2" fill={isSystemAlert ? '#ffbd2e' : '#00ff9d'} />
                      <path d="M30 6 V0" stroke={isSystemAlert ? '#ffbd2e' : '#00ff9d'} strokeWidth="1.4" strokeLinecap="round" />
                      <circle cx="18" cy="38" r="4" fill="#0b0b0b" stroke="white" strokeWidth="2" />
                      <circle cx="44" cy="38" r="4" fill="#0b0b0b" stroke="white" strokeWidth="2" />
                   </g>
                </motion.g>
             </svg>

             {/* Map Overlay UI */}
             <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-lg border border-white/10 bg-black/80 p-3 backdrop-blur shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                     <MapPin className="h-4 w-4" /> Coordenadas
                  </div>
                   <div className="font-mono tabular-nums text-sm text-white">3.743° S, 73.244° W</div>
                  </div>
                  {isOffline && (
                     <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-900/25 p-3 text-orange-200 backdrop-blur shadow-lg shadow-orange-500/10">
                        <HardDrive className="h-4 w-4" /> 
                        <span className="text-xs font-bold tracking-wide">REGISTRO LOCAL ACTIVO</span>
                     </div>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/70 p-3 shadow-lg shadow-emerald-500/10 backdrop-blur">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400">
                    <span className="text-[10px] font-bold text-[#00ff9d]">{isSystemAlert ? 'PATRULLA EN ALERTA' : 'PATRULLA EN CURSO'}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="font-mono tabular-nums text-[11px] text-gray-200">{Math.round(Math.min(Math.max(journeyPosition, 0), 1) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${
                        isSystemAlert
                          ? 'bg-gradient-to-r from-orange-400 via-red-500 to-red-700'
                          : 'bg-gradient-to-r from-[#00ff9d] via-cyan-400 to-teal-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(journeyPosition, 0), 1) * 100}%` }}
                    />
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* RIGHT PANEL: CONTROL */}
        <div className="flex-1 border-l border-white/10">
           <ControlPanel />
        </div>

      </div>

      {/* FOOTER STRIP */}
      <footer className="relative z-50 flex h-10 items-center justify-center overflow-hidden bg-yellow-500/10 text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-600">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #EAB308 10px, #EAB308 20px)' }} />
         <span className="relative bg-black px-4 py-1 text-yellow-500">
            PROYECTO DE CONSERVACIÓN AMAZÓNICA · PILOTO OFFLINE
         </span>
      </footer>
      
      {/* Screen Flash Overlay on Incident Start */}
      <AnimatePresence>
        {isSystemAlert && seconds < 17 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-[100] bg-red-600 mix-blend-overlay"
          />
        )}
      </AnimatePresence>
    </main>
  );
}

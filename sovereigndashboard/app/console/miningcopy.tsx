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
  Terminal,
  Thermometer,
  Truck,
  WifiOff,
} from 'lucide-react';

// --- TYPES & CONFIG ---
type Phase = 'NORMAL' | 'BLIND' | 'INCIDENT';

const STORY_DURATION = 60; // seconds loop
const BRAND_GREEN = '#009B3A';
const BRAND_ORANGE = '#F58220';

// Adjusted Route path: A switchback road spiraling down into the pit
// M(Start Top Right) -> Switchback Left -> Switchback Right -> End Bottom Left (Pit Floor)
const ROUTE_PATH_D =
  'M 750 100 C 600 120 400 150 300 200 C 250 225 250 275 300 300 C 400 350 600 380 650 400 C 700 420 700 460 600 480 C 400 520 200 540 130 550';

// Zone where signal is lost (approx 40% to 75% of the path)
const SILENT_ZONE_RANGE = { start: 0.40, end: 0.75 };

const SYSTEM_LOGS = [
  { t: 12, msg: 'AVISO: Señal LTE débil (-110dBm). Zona de sombra.', type: 'warning' },
  { t: 15, msg: 'CONEXIÓN PERDIDA. Iniciando Modo Soberano (Edge AI).', type: 'error' },
  { t: 18, msg: 'ALERTA: Freno Trasero Izq - Aumento Térmico (+15%).', type: 'error' },
  { t: 19, msg: 'EDGE AI: Analizando vibración de rodamientos...', type: 'info' },
  { t: 22, msg: 'CRÍTICO: Temp > 580°C. Falla en Retardador.', type: 'error' },
  { t: 25, msg: 'ACCIÓN: Derating Automático de Motor (Prot. Activa).', type: 'action' },
  { t: 28, msg: 'NOTIFICACIÓN: Operador alertado via pantalla local.', type: 'info' },
  { t: 45, msg: 'ENLACE RESTAURADO: Subiendo paquete de incidente (4MB).', type: 'success' },
];

// --- UTILS ---
const noise = (seed: number, amplitude: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * amplitude;
};

// High-performance Number component that animates without React re-renders
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
      {unit && <span className="ml-1 text-xs text-gray-400">{unit}</span>}
    </span>
  );
};

function useStoryClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s + 1) % STORY_DURATION), 1000);
    return () => window.clearInterval(id);
  }, []);
  return seconds;
}

// --- SUB-COMPONENTS ---

const TopHeader = React.memo(({ isOffline, isSystemAlert }: { isOffline: boolean; isSystemAlert: boolean }) => (
  <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0f0e0e] px-6 shadow-2xl shrink-0 z-20">
    <div className="flex items-baseline gap-4">
      <div className="flex items-center gap-2">
         <div className="h-3 w-3 bg-orange-500 rounded-sm transform rotate-45" />
         <h1 className="text-2xl font-black tracking-tighter text-white uppercase">QORI MINE</h1>
      </div>
      <span className="text-[10px] font-bold tracking-[0.2em] text-stone-500 hidden md:inline-block uppercase">
        Monitor de Rajo Abierto v2.4
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-bold tracking-widest border-emerald-500/30 bg-emerald-900/10 text-emerald-400/80">
        <Cpu className="h-3.5 w-3.5" /> CORE: OK
      </div>

      <div
        className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-500 ${
          isOffline
            ? 'border-red-500/50 bg-red-900/20 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
            : 'border-blue-500/30 bg-blue-900/10 text-blue-300'
        }`}
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3.5 w-3.5" /> 4G: LOST
          </>
        ) : (
          <>
            <Radio className="h-3.5 w-3.5" /> 4G: SIGNAL
          </>
        )}
      </div>

      <div
        className={`flex items-center gap-2 rounded-sm border px-4 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-500 ${
          isSystemAlert
            ? 'border-orange-500 bg-orange-600 text-black shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse'
            : 'border-stone-700 bg-stone-800 text-stone-400'
        }`}
      >
        {isSystemAlert ? (
          <>
            <AlertTriangle className="h-4 w-4 text-black" fill="currentColor" /> ALERTA TÉRMICA
          </>
        ) : (
          <>
            <Activity className="h-4 w-4" /> ESTADO NOMINAL
          </>
        )}
      </div>
    </div>
  </header>
));
TopHeader.displayName = 'TopHeader';

const MapOverlayUI = ({ 
  isOffline, 
  isSystemAlert, 
  brakeTemp,
  payload
}: { 
  isOffline: boolean; 
  isSystemAlert: boolean; 
  brakeTemp: number;
  payload: number;
}) => (
  <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
    {/* Top Left: Coordinates */}
    <div className="flex flex-col gap-2 items-start">
       <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-sm shadow-lg">
         <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Ubicación (GPS/IMU)</div>
         <div className="font-mono text-emerald-500 text-sm">S 14° 12' 44.2"</div>
         <div className="font-mono text-emerald-500 text-sm">W 72° 21' 08.1"</div>
         {isOffline && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-orange-400 font-bold bg-orange-950/30 px-2 py-1 rounded">
              <HardDrive className="h-3 w-3" /> REGISTRO LOCAL
            </div>
         )}
       </div>
    </div>

    {/* Bottom Left: Brake Temp (CRITICAL METRIC) */}
    <div className="flex flex-col gap-2 items-start w-64">
        <div className={`w-full backdrop-blur-md border-l-4 p-4 rounded-r-sm shadow-2xl transition-colors duration-300 ${isSystemAlert ? 'bg-red-950/80 border-red-500' : 'bg-black/80 border-stone-600'}`}>
            <div className="flex items-center gap-2 mb-1">
                <Thermometer className={`h-4 w-4 ${isSystemAlert ? 'text-red-500' : 'text-stone-400'}`} />
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Temp. Frenos</span>
            </div>
            <div className="flex items-baseline gap-1">
                <AnimatedNumber 
                    value={brakeTemp} 
                    decimals={0} 
                    className={`text-4xl font-mono font-bold tracking-tighter ${isSystemAlert ? 'text-red-500' : 'text-white'}`} 
                />
                <span className="text-sm text-stone-500">°C</span>
            </div>
            {/* Bar Gauge */}
            <div className="w-full h-1.5 bg-stone-800 mt-2 rounded-full overflow-hidden">
                <motion.div 
                    className={`h-full ${isSystemAlert ? 'bg-red-500' : 'bg-emerald-500'}`}
                    initial={{ width: '30%' }}
                    animate={{ width: `${(brakeTemp / 700) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                />
            </div>
        </div>
    </div>

    {/* Top Right: Payload (Secondary Metric) */}
    <div className="absolute top-6 right-6">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-sm shadow-lg text-right">
             <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Carga Neta</div>
             <div className="flex items-baseline justify-end gap-1">
                <AnimatedNumber value={payload} decimals={1} className="text-3xl font-mono font-bold text-white" />
                <span className="text-xs text-stone-500">TON</span>
             </div>
        </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function MineGuardPage() {
  const seconds = useStoryClock();
  const [operatorMessage, setOperatorMessage] = useState('');
  const [userMessages, setUserMessages] = useState<{ id: number; msg: string; ts: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const routePathRef = useRef<SVGPathElement | null>(null);
  const routeLengthRef = useRef(0);
  const isMountedRef = useRef(false);

  // Motion values for high-performance animation
  const smoothJourney = useMotionValue(0);
  const truckX = useMotionValue(750);
  const truckY = useMotionValue(100);
  const truckRotation = useMotionValue(0);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset user messages when loop restarts
  useEffect(() => {
    if (seconds === 0) setUserMessages([]);
  }, [seconds]);

  const handleSend = () => {
    const message = operatorMessage.trim();
    if (!message) return;
    setUserMessages((prev) => [...prev, { id: Date.now(), msg: message, ts: seconds }]);
    setOperatorMessage('');
  };

  // Phase Logic: 0-15s Normal, 15-45s Incident, 45s+ Recovery
  const phase: Phase = useMemo(() => {
    if (seconds < 15) return 'NORMAL';
    if (seconds < 45) return 'INCIDENT';
    return 'NORMAL'; // Back to normal/sync
  }, [seconds]);

  const isOffline = seconds >= 15 && seconds < 45;
  const isSystemAlert = seconds >= 18 && seconds < 40;

  // Simulation Values
  const journeyProgress = Math.min(seconds / STORY_DURATION, 1); 
  
  // Brake Temp Simulation: Normal ~300, Spikes to ~600
  const brakeTemp = useMemo(() => {
    const baseTemp = 320;
    if (seconds < 18) return baseTemp + noise(seconds, 10);
    if (seconds >= 18 && seconds < 40) {
        // Incident spike
        const spikeProgress = Math.min((seconds - 18) / 10, 1);
        return baseTemp + (spikeProgress * 280) + noise(seconds, 15); // Max ~600
    }
    // Cooling down
    return 450 - ((seconds - 40) * 10); 
  }, [seconds]);

  // Payload Simulation: Steady around 380 tons, slight shift on turns
  const payload = useMemo(() => {
      return 384.5 + noise(seconds, 2.5);
  }, [seconds]);

  // Initialize Path Length
  useEffect(() => {
    if (!mounted) return;
    const el = routePathRef.current;
    if (!el) return;
    routeLengthRef.current = el.getTotalLength();
    
    // Initial placement
    const len = routeLengthRef.current;
    const point = el.getPointAtLength(Math.min(journeyProgress * len, len - 0.1));
    const nextPoint = el.getPointAtLength(Math.min(journeyProgress * len + 1, len));
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set((Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI);
    smoothJourney.set(journeyProgress);
  }, [journeyProgress, mounted, smoothJourney, truckRotation, truckX, truckY]);

  // Animate Journey Progress
  useEffect(() => {
    const controls = animate(smoothJourney, journeyProgress, { duration: 0.9, ease: 'linear' });
    return controls.stop;
  }, [journeyProgress, smoothJourney]);

  // Update Truck Position via MotionValue (No React Renders)
  useMotionValueEvent(smoothJourney, 'change', (latest) => {
    if (!isMountedRef.current) return;
    const path = routePathRef.current;
    if (!path) return;
    const len = routeLengthRef.current || path.getTotalLength();
    routeLengthRef.current = len;
    
    const clamped = Math.min(Math.max(latest, 0), 1);
    const dist = Math.min(clamped * len, len - 0.1);
    
    const point = path.getPointAtLength(dist);
    // Look ahead for rotation
    const nextPoint = path.getPointAtLength(Math.min(dist + 5, len)); // Look ahead 5px for smoother rotation
    
    const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;
    
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set(angle);
  });

  // Logs Aggregation
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

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [combinedLogs.length]);

  if (!mounted) return null;

  return (
    <main className="flex h-screen w-screen flex-col bg-[#050505] text-stone-200 overflow-hidden font-sans selection:bg-orange-500/30">
      
      <TopHeader isOffline={isOffline} isSystemAlert={isSystemAlert} />

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT PANEL: OPEN PIT MAP (VISUALIZATION) --- */}
        <div className="relative flex-[2] bg-[#080706] border-r border-white/5">
          
          {/* Background: Rock Textures & Radial Gradients for Depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(50,40,30,0.4),rgba(0,0,0,1))]" />
          
          {/* Grid Pattern (Topographic hint) */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#444_1px,transparent_1px),linear-gradient(90deg,#444_1px,transparent_1px)] bg-[size:60px_60px]" />

          {/* Map Container */}
          <div className="absolute inset-0 p-0 overflow-hidden">
             {/* The Map Overlay UI (Payload, Temp, Coordinates) */}
            <MapOverlayUI 
                isOffline={isOffline} 
                isSystemAlert={isSystemAlert} 
                brakeTemp={brakeTemp}
                payload={payload}
            />

            <svg viewBox="0 0 900 600" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="roadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#333" />
                  <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <filter id="mud-texture">
                   <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                   <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 1 0" />
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
                </marker>
              </defs>

              {/* Terrain Terraces (Concentric approximate rings for Pit Depth) */}
              <path d="M 0 600 L 0 0 L 900 0 L 900 600 Z" fill="none" />
              
              {/* Simplified "Contour" Levels - Darker as we go deeper (simulating pit hole) */}
              <ellipse cx="450" cy="350" rx="420" ry="280" fill="#1c1917" stroke="#292524" strokeWidth="2" />
              <ellipse cx="450" cy="350" rx="350" ry="220" fill="#151413" stroke="#292524" strokeWidth="2" />
              <ellipse cx="450" cy="350" rx="280" ry="170" fill="#0c0a09" stroke="#292524" strokeWidth="2" />
              <ellipse cx="450" cy="350" rx="200" ry="120" fill="#000000" stroke="#292524" strokeWidth="2" />

              {/* Dead Zone Highlighting */}
              {isOffline && (
                  <g>
                      <path 
                        d="M 250 225 L 650 400 L 600 480 L 200 540 Z" 
                        fill="url(#roadGradient)" 
                        opacity="0.2"
                      />
                      <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                        <rect width="2" height="8" transform="translate(0,0)" fill="#f97316" opacity="0.2" />
                      </pattern>
                      <circle cx="450" cy="350" r="180" fill="url(#hatch)" opacity="0.3" />
                      <text x="450" y="350" textAnchor="middle" className="text-[10px] font-bold tracking-widest fill-orange-600 opacity-60">ZONA SIN COBERTURA</text>
                  </g>
              )}

              {/* The Road Path */}
              <path d={ROUTE_PATH_D} fill="none" stroke="#3f3f46" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
              <path d={ROUTE_PATH_D} fill="none" stroke="#1c1917" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
              {/* Road Centerline */}
              <path d={ROUTE_PATH_D} fill="none" stroke="#57534e" strokeWidth={1} strokeDasharray="8 8" strokeLinecap="round" />

              {/* Reference path for motion (invisible) */}
              <path ref={routePathRef} d={ROUTE_PATH_D} fill="none" stroke="transparent" />

              {/* THE ASSET (KOMATSU 980E REPRESENTATION) */}
              <motion.g
                style={{
                  x: truckX,
                  y: truckY,
                  rotate: truckRotation,
                }}
              >
                {/* Safety Halo */}
                <motion.circle 
                    r={35} 
                    fill={isSystemAlert ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.05)'}
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />

                {/* Truck Icon - Top Down View */}
                <g transform="translate(-20, -15) scale(1.2)">
                    {/* Wheels */}
                    <rect x="0" y="0" width="10" height="6" fill="#111" rx="1" />
                    <rect x="0" y="24" width="10" height="6" fill="#111" rx="1" />
                    <rect x="30" y="0" width="10" height="6" fill="#111" rx="1" />
                    <rect x="30" y="24" width="10" height="6" fill="#111" rx="1" />
                    
                    {/* Chassis */}
                    <rect x="4" y="4" width="32" height="22" fill="#ca8a04" rx="2" stroke="#000" strokeWidth="0.5" />
                    
                    {/* Dump Bed (Yellow) */}
                    <rect x="2" y="2" width="28" height="26" fill="#eab308" rx="1" stroke="#000" strokeWidth="0.5" />
                    {/* Bed Ribs */}
                    <line x1="8" y1="2" x2="8" y2="28" stroke="#ca8a04" strokeWidth="1" />
                    <line x1="14" y1="2" x2="14" y2="28" stroke="#ca8a04" strokeWidth="1" />
                    <line x1="20" y1="2" x2="20" y2="28" stroke="#ca8a04" strokeWidth="1" />
                    
                    {/* Cab (Offset to left usually) */}
                    <rect x="30" y="2" width="8" height="10" fill="#d4d4d8" stroke="#000" strokeWidth="0.5" />
                    <rect x="32" y="4" width="4" height="6" fill="#1e293b" />
                </g>
              </motion.g>
            </svg>
          </div>
        </div>

        {/* --- RIGHT PANEL: BLACK BOX TERMINAL --- */}
        <div className="flex-1 flex flex-col bg-[#050505] border-l border-white/10 max-w-md z-20">
            {/* Status Strip */}
            <div className={`p-4 border-b border-white/10 ${isSystemAlert ? 'bg-red-950/20' : 'bg-stone-900/20'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Caja Negra (Local)</span>
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-600'}`} />
                        <span className="text-[10px] text-stone-400">{isOffline ? 'GRABANDO' : 'EN ESPERA'}</span>
                    </div>
                </div>
                <div className="font-mono text-xs text-stone-400">
                    <div>ID_UNIDAD: <span className="text-white">R-240</span></div>
                    <div>DRIVER: <span className="text-white">J. MAMANI</span></div>
                    <div className="mt-1">BUFFER: <span className="text-emerald-500">{(seconds * 0.8).toFixed(1)} MB</span></div>
                </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a] font-mono text-xs">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-stone-700">
                    {combinedLogs.map((log) => {
                        const isUser = log.source === 'user';
                        let colorClass = 'text-stone-400 border-stone-800';
                        
                        if (log.type === 'error') colorClass = 'text-red-400 border-red-900/30 bg-red-950/10';
                        else if (log.type === 'warning') colorClass = 'text-orange-300 border-orange-900/30 bg-orange-950/10';
                        else if (log.type === 'success') colorClass = 'text-emerald-400 border-emerald-900/30 bg-emerald-950/10';
                        else if (log.type === 'action') colorClass = 'text-yellow-200 border-yellow-900/30 bg-yellow-950/10';
                        else if (isUser) colorClass = 'text-blue-300 border-blue-900/30 bg-blue-950/10 text-right';

                        return (
                            <motion.div 
                                key={log.id}
                                initial={{ opacity: 0, x: isUser ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-2 border-l-2 rounded-sm ${colorClass} ${isUser ? 'border-r-2 border-l-0 pl-2 pr-3 ml-8' : 'mr-8'}`}
                            >
                                <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px]">
                                    {isUser ? null : <span className="font-bold">[{log.ts.toFixed(2)}s]</span>}
                                    <span>{isUser ? 'OPERADOR' : 'SYSTEM_DAEMON'}</span>
                                </div>
                                <div>{log.msg}</div>
                            </motion.div>
                        )
                    })}
                    <div ref={chatBottomRef} />
                </div>

                {/* Input (Mock Functionality) */}
                <div className="p-3 border-t border-white/10 bg-black">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2 bg-stone-900/50 border border-stone-700 p-2 rounded-sm focus-within:border-orange-500/50 transition-colors"
                    >
                        <ChevronRight className="h-3 w-3 text-stone-500" />
                        <input 
                            value={operatorMessage}
                            onChange={(e) => setOperatorMessage(e.target.value)}
                            placeholder="Escribir anotación..." 
                            className="bg-transparent w-full outline-none text-stone-300 placeholder:text-stone-600"
                        />
                        <button type="submit" disabled={!operatorMessage} className="text-stone-400 hover:text-white disabled:opacity-30">
                            <Send className="h-3 w-3" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="relative z-50 h-6 bg-[#111] border-t border-white/10 flex items-center justify-between px-4 text-[9px] text-stone-500 uppercase tracking-widest">
        <span>Qori Mine Guard v2.0.4</span>
        <span className={isOffline ? 'text-orange-500 font-bold' : 'text-stone-500'}>
            {isOffline ? 'MODO DESCONECTADO' : 'CONECTADO A RED MESH'}
        </span>
      </footer>

      {/* CRITICAL ALERT FLASH OVERLAY */}
      <AnimatePresence>
        {isSystemAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="pointer-events-none absolute inset-0 z-[100] bg-red-600 mix-blend-overlay"
          />
        )}
      </AnimatePresence>
    </main>
  );
}
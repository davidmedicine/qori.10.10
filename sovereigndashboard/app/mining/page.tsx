'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  Brain,
  ChevronRight,
  Eye,
  Heart,
  Layers,
  MapPin,
  Mountain,
  Radio,
  Scan,
  Send,
  ShieldCheck,
  Signal,
  WifiOff,
} from 'lucide-react';

// --- TYPES & CONFIG ---
type Phase = 'NORMAL' | 'RISK' | 'INTERVENTION';

const STORY_DURATION = 60; // seconds loop

// Route: Spiraling into the pit
const ROUTE_PATH_D =
  'M 750 100 C 600 120 400 150 300 200 C 250 225 250 275 300 300 C 400 350 600 380 650 400 C 700 420 700 460 600 480 C 400 520 200 540 130 550';

// NARRATIVE: Saving a Life, Not a Truck
const SYSTEM_LOGS = [
  { t: 5, msg: 'BIO-WATCH: Sincronizando sensores biométricos...', type: 'info' },
  { t: 12, msg: 'TELEMETRÍA: O2 Sat 98% @ 4200 msnm.', type: 'success' },
  { t: 15, msg: 'GUARDIAN AI: Activo. Monitoreando signos vitales.', type: 'info' },
  { t: 20, msg: 'ALERTA FATIGA: Microsueño detectado (Ojos cerrados > 1.5s).', type: 'warning' },
  { t: 21, msg: 'BIO-METRICS: Pulso elevado (115 BPM). Estrés agudo.', type: 'warning' },
  { t: 22, msg: 'GEOTECH ALERT: Inestabilidad de talud detectada (Sector 4).', type: 'error' },
  { t: 23, msg: 'RADAR: Desplazamiento de tierra > 15mm/s.', type: 'error' },
  { t: 25, msg: 'INTERVENCIÓN: Frenado de Emergencia Activado.', type: 'action' },
  { t: 28, msg: 'ESTADO: Unidad detenida en zona segura.', type: 'success' },
  { t: 45, msg: 'REPORT: Incidente subido a Centro de Control.', type: 'info' },
];

// --- UTILS ---
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
      {unit && <span className="ml-1 text-xs opacity-60">{unit}</span>}
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

// 1. EKG Animation Component
const EKGLine = ({ color }: { color: string }) => (
  <svg viewBox="0 0 200 50" className="h-full w-full overflow-visible">
    <motion.path
      d="M 0 25 L 20 25 L 25 25 L 30 10 L 35 40 L 40 5 L 45 45 L 50 25 L 200 25"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0, x: -50 }}
      animate={{ 
        pathLength: [0, 1, 1], 
        opacity: [0, 1, 0],
        x: [0, 0, 200]
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "linear",
        repeatDelay: 0.5 
      }}
    />
    {/* Grid background for EKG */}
    <path d="M 0 10 L 200 10 M 0 20 L 200 20 M 0 30 L 200 30 M 0 40 L 200 40" stroke={color} strokeOpacity="0.1" strokeWidth="0.5" />
    <path d="M 40 0 L 40 50 M 80 0 L 80 50 M 120 0 L 120 50 M 160 0 L 160 50" stroke={color} strokeOpacity="0.1" strokeWidth="0.5" />
  </svg>
);

const TopHeader = React.memo(({ 
  brandName, 
  brandColor, 
  isAlert 
}: { 
  brandName: string; 
  brandColor: string; 
  isAlert: boolean 
}) => (
  <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0f172a] px-6 shadow-2xl shrink-0 z-20">
    <div className="flex items-baseline gap-4">
      <div className="flex items-center gap-2">
         {/* Dynamic Brand Logo Color */}
         <div 
            className="h-3 w-3 rounded-sm transform rotate-45 shadow-[0_0_10px_currentColor]" 
            style={{ backgroundColor: brandColor, color: brandColor }}
         />
         <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
            {brandName} <span className="text-slate-600 font-light">GUARD</span>
         </h1>
      </div>
      <span 
        className="text-[10px] font-bold tracking-[0.2em] opacity-50 hidden md:inline-block uppercase"
        style={{ color: brandColor }}
      >
        Bio-Safety Protocol v3.0
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-sm border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-slate-400">
        <Brain className="h-3.5 w-3.5" /> GUARDIAN AI: ON
      </div>

      <div
        className={`flex items-center gap-2 rounded-sm border px-4 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-500 ${
          isAlert
            ? 'border-red-500 bg-red-600 text-black shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse'
            : 'border-slate-700 bg-slate-800 text-slate-400'
        }`}
      >
        {isAlert ? (
          <>
            <AlertOctagon className="h-4 w-4 text-black" fill="currentColor" /> INTERVENTION
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" /> SAFE
          </>
        )}
      </div>
    </div>
  </header>
));
TopHeader.displayName = 'TopHeader';

const MapOverlayUI = ({ 
  heartRate,
  o2Sat,
  slopeStability,
  brandColor,
  isAlert
}: { 
  heartRate: number;
  o2Sat: number;
  slopeStability: number;
  brandColor: string;
  isAlert: boolean;
}) => (
  <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
    
    {/* TOP LEFT: Location / Static */}
    <div className="flex flex-col gap-2 items-start">
       <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-sm shadow-lg">
         <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Sector GPS</div>
         <div className="font-mono text-slate-200 text-sm">LAT: S 14.212</div>
         <div className="font-mono text-slate-200 text-sm">LON: W 72.351</div>
       </div>
    </div>

    {/* TOP RIGHT: BIO-TELEMETRY (The Ethical Dashboard) */}
    <div className="absolute top-6 right-6 w-72">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-sm shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between bg-slate-900/50 px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" style={{ color: brandColor }} />
                    <span className="text-[10px] font-bold tracking-widest text-white">BIO-TELEMETRY</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
             </div>
             
             <div className="p-4">
                <div className="h-16 w-full mb-4 bg-slate-900/50 rounded border border-slate-800/50 relative overflow-hidden">
                    <EKGLine color={brandColor} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Heart Rate</div>
                        <div className="flex items-baseline gap-1">
                            <AnimatedNumber 
                                value={heartRate} 
                                className={`text-3xl font-mono font-bold ${heartRate > 110 ? 'text-red-500' : 'text-white'}`} 
                            />
                            <span className="text-xs text-slate-500">BPM</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">O2 Level</div>
                        <div className="flex items-baseline justify-end gap-1">
                            <AnimatedNumber value={o2Sat} decimals={0} className="text-3xl font-mono font-bold text-white" />
                            <span className="text-xs text-slate-500">%</span>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    </div>

    {/* BOTTOM LEFT: GEOTECH RADAR */}
    <div className="flex flex-col gap-2 items-start w-64">
        <div className={`w-full backdrop-blur-md border-l-4 p-4 rounded-r-sm shadow-2xl transition-colors duration-300 ${isAlert ? 'bg-red-950/90 border-red-500' : 'bg-slate-950/90 border-slate-600'}`}>
            <div className="flex items-center gap-2 mb-3">
                <Layers className={`h-4 w-4 ${isAlert ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Geotech Radar</span>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Radar Animation */}
                <div className="relative h-16 w-16 rounded-full border border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center">
                     {/* Radar Sweep */}
                     <motion.div 
                        className="absolute inset-0 rounded-full"
                        style={{ 
                            background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${isAlert ? '#ef4444' : brandColor} 360deg)`,
                            opacity: 0.4
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     />
                     {/* Grid Lines */}
                     <div className="absolute inset-0 border border-slate-700 rounded-full scale-50 opacity-30" />
                     <div className="absolute h-full w-[1px] bg-slate-700 opacity-30" />
                     <div className="absolute w-full h-[1px] bg-slate-700 opacity-30" />
                </div>

                <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Slope Stability</div>
                    <div className="flex items-baseline gap-1">
                        <AnimatedNumber 
                            value={slopeStability} 
                            decimals={1} 
                            className={`text-2xl font-mono font-bold tracking-tighter ${slopeStability > 10 ? 'text-red-500' : 'text-white'}`} 
                        />
                        <span className="text-xs text-slate-500">mm/s</span>
                    </div>
                    {slopeStability > 10 && <div className="text-[9px] text-red-500 font-bold animate-pulse mt-1">CRITICAL DISPLACEMENT</div>}
                </div>
            </div>
        </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function HumanSafetyDashboard() {
  const searchParams = useSearchParams();
  const seconds = useStoryClock();
  
  // --- 1. DYNAMIC BRANDING LOGIC ---
  const clientParam = searchParams.get('client');
  
  const brandConfig = useMemo(() => {
    const brands: Record<string, { name: string; color: string }> = {
      antamina: { name: 'ANTAMINA', color: '#009B3A' }, // Green
      lasbambas: { name: 'LAS BAMBAS', color: '#e11d48' }, // Reddish
      default: { name: 'QORI', color: '#14b8a6' }, // Medical Teal (Default)
    };
    return brands[clientParam || 'default'] || brands['default'];
  }, [clientParam]);

  // State
  const [operatorMessage, setOperatorMessage] = useState('');
  const [userMessages, setUserMessages] = useState<{ id: number; msg: string; ts: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const routePathRef = useRef<SVGPathElement | null>(null);
  const routeLengthRef = useRef(0);
  const isMountedRef = useRef(false);

  // Motion values
  const smoothJourney = useMotionValue(0);
  const truckX = useMotionValue(750);
  const truckY = useMotionValue(100);
  const truckRotation = useMotionValue(0);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);
    return () => { isMountedRef.current = false; };
  }, []);

  // Reset chat on loop
  useEffect(() => {
    if (seconds === 0) setUserMessages([]);
  }, [seconds]);

  const handleSend = () => {
    const message = operatorMessage.trim();
    if (!message) return;
    setUserMessages((prev) => [...prev, { id: Date.now(), msg: message, ts: seconds }]);
    setOperatorMessage('');
  };

  // --- 2. SIMULATION LOGIC (SAFETY NARRATIVE) ---
  
  // Timeline:
  // 0-20s: Normal Operation
  // 20-25s: Risk Detected (Microsleep + Slope Instability)
  // 25-40s: Intervention (Auto Brakes)
  // 40-60s: Safe State

  const isAlert = seconds >= 22 && seconds < 40;

  const journeyProgress = useMemo(() => {
     if (seconds < 25) return seconds / STORY_DURATION; // Normal speed
     if (seconds < 40) return 25 / STORY_DURATION; // Stopped during intervention
     return (25 + ((seconds - 40) * 0.5)) / STORY_DURATION; // Slow recovery
  }, [seconds]);

  // Metrics Simulation
  const heartRate = useMemo(() => {
      if (seconds < 18) return 75 + noise(seconds, 5); // Normal Resting
      if (seconds < 40) return 115 + noise(seconds, 10); // Panic / Stress event
      return 85 - ((seconds - 40)); // Recovery
  }, [seconds]);

  const o2Sat = 98 + noise(seconds, 0.5);

  const slopeStability = useMemo(() => {
      if (seconds < 20) return 0.2 + Math.abs(noise(seconds, 0.1));
      if (seconds < 40) return 15 + Math.abs(noise(seconds, 3)); // LANDSLIDE DETECTED
      return 0.2; // Stabilized
  }, [seconds]);

  // Path Animation
  useEffect(() => {
    if (!mounted) return;
    const el = routePathRef.current;
    if (!el) return;
    routeLengthRef.current = el.getTotalLength();
    
    const len = routeLengthRef.current;
    const point = el.getPointAtLength(Math.min(journeyProgress * len, len - 0.1));
    const nextPoint = el.getPointAtLength(Math.min(journeyProgress * len + 1, len));
    
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set((Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI);
    smoothJourney.set(journeyProgress);
  }, [journeyProgress, mounted, smoothJourney, truckRotation, truckX, truckY]);

  // Smooth animation wrapper
  useEffect(() => {
    const controls = animate(smoothJourney, journeyProgress, { duration: 0.5, ease: 'linear' });
    return controls.stop;
  }, [journeyProgress, smoothJourney]);

  useMotionValueEvent(smoothJourney, 'change', (latest) => {
    if (!isMountedRef.current || !routePathRef.current) return;
    const path = routePathRef.current;
    const len = routeLengthRef.current || path.getTotalLength();
    
    const dist = Math.min(Math.max(latest, 0) * len, len - 0.1);
    const point = path.getPointAtLength(dist);
    const nextPoint = path.getPointAtLength(Math.min(dist + 5, len));
    
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set((Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI);
  });

  // Log Combiner
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
    <main className="flex h-screen w-screen flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-teal-500/30">
      
      <TopHeader brandName={brandConfig.name} brandColor={brandConfig.color} isAlert={isAlert} />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- LEFT PANEL: RADAR MAP --- */}
        <div className="relative flex-[2] bg-[#020617] border-r border-white/5">
          
          {/* Background: Dark Radar aesthetic */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),rgba(2,6,23,1))]" />
          
          {/* Radar Grid */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] bg-[size:80px_80px]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
             <div className="w-[600px] h-[600px] rounded-full border border-slate-600" />
             <div className="absolute w-[400px] h-[400px] rounded-full border border-slate-700" />
             <div className="absolute w-[200px] h-[200px] rounded-full border border-slate-800" />
          </div>

          {/* Map View */}
          <div className="absolute inset-0 p-0 overflow-hidden">
            <MapOverlayUI 
                heartRate={heartRate}
                o2Sat={o2Sat}
                slopeStability={slopeStability}
                brandColor={brandConfig.color}
                isAlert={isAlert}
            />

            <svg viewBox="0 0 900 600" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid slice">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Slope / Terrain Abstract Lines */}
              <path d="M 0 600 L 200 550 L 600 480 L 900 600 Z" fill="none" stroke="#1e293b" strokeWidth="2" />
              <path d="M 900 0 L 750 100 L 900 200 Z" fill="none" stroke="#1e293b" strokeWidth="2" />

              {/* Danger Zone - Geotech Instability Area */}
              <circle cx="400" cy="300" r="120" fill="url(#hatch)" opacity={isAlert ? 0.3 : 0} className="transition-opacity duration-1000" />
              <pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                 <rect width="2" height="10" fill="#ef4444" opacity="0.5" />
              </pattern>

              {/* The Road Path */}
              <path d={ROUTE_PATH_D} fill="none" stroke="#1e293b" strokeWidth={20} strokeLinecap="round" />
              <path d={ROUTE_PATH_D} fill="none" stroke={brandConfig.color} strokeOpacity="0.3" strokeWidth={2} strokeDasharray="4 4" />
              <path ref={routePathRef} d={ROUTE_PATH_D} fill="none" stroke="transparent" />

              {/* THE ASSET (Abstract Geometric Representation) */}
              <motion.g
                style={{ x: truckX, y: truckY, rotate: truckRotation }}
              >
                {/* Safety Halo (Geofence) */}
                <motion.circle 
                    r={40} 
                    stroke={isAlert ? '#ef4444' : brandConfig.color}
                    strokeWidth="1"
                    fill="none"
                    animate={{ scale: [1, 1.1], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />

                {/* Vehicle Icon */}
                <g transform="rotate(90)"> {/* Rotate to align with path tangent */}
                    <path d="M -10 -15 L 10 -15 L 12 15 L -12 15 Z" fill="#0f172a" stroke={isAlert ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
                    <rect x="-8" y="5" width="16" height="8" rx="1" fill={isAlert ? '#ef4444' : brandConfig.color} />
                </g>
              </motion.g>
            </svg>
          </div>
        </div>

        {/* --- RIGHT PANEL: NARRATIVE LOGS --- */}
        <div className="flex-1 flex flex-col bg-[#020617] border-l border-slate-800 max-w-md z-20 shadow-xl">
            {/* Status Header */}
            <div className={`p-4 border-b border-slate-800 ${isAlert ? 'bg-red-950/20' : 'bg-slate-900/30'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Safety Log</span>
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] text-slate-400">{isAlert ? 'CRITICAL EVENT' : 'MONITORING'}</span>
                    </div>
                </div>
                <div className="font-mono text-xs text-slate-500">
                    <div>OPERATOR: <span className="text-white">M. QUISPE</span></div>
                    <div>SHIFT: <span className="text-white">NOCTURNO (11H)</span></div>
                </div>
            </div>

            {/* Logs Feed */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#020617] font-mono text-xs relative">
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] opacity-20" />
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                    {combinedLogs.map((log) => {
                        const isUser = log.source === 'user';
                        // Log Styling based on Type
                        let borderClass = 'border-slate-800';
                        let textClass = 'text-slate-400';
                        let bgClass = '';

                        if (log.type === 'error') {
                             textClass = 'text-red-400';
                             borderClass = 'border-red-900/50';
                             bgClass = 'bg-red-950/10';
                        } else if (log.type === 'warning') {
                             textClass = 'text-orange-300';
                             borderClass = 'border-orange-900/50';
                             bgClass = 'bg-orange-950/10';
                        } else if (log.type === 'success') {
                             textClass = 'text-emerald-400';
                             borderClass = 'border-emerald-900/50';
                             bgClass = 'bg-emerald-950/10';
                        } else if (log.type === 'action') {
                             textClass = 'text-white font-bold';
                             borderClass = 'border-white/30';
                             bgClass = 'bg-white/5';
                        } else if (isUser) {
                             textClass = 'text-blue-300';
                             borderClass = 'border-blue-900/50';
                             bgClass = 'bg-blue-950/10';
                        }

                        return (
                            <motion.div 
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-2 border-l-2 rounded-r-sm mb-2 ${borderClass} ${bgClass} ${isUser ? 'text-right border-l-0 border-r-2' : ''}`}
                            >
                                <div className="flex items-center gap-2 mb-1 opacity-50 text-[9px] uppercase tracking-wider">
                                    <span>T+{log.ts}s</span>
                                    <span>{isUser ? 'COMMS' : 'SYSTEM'}</span>
                                </div>
                                <div className={textClass}>{log.msg}</div>
                            </motion.div>
                        )
                    })}
                    <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-800 bg-[#0f172a]">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-sm focus-within:border-teal-500/50 transition-colors"
                    >
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                        <input 
                            value={operatorMessage}
                            onChange={(e) => setOperatorMessage(e.target.value)}
                            placeholder="Log operator note..." 
                            className="bg-transparent w-full outline-none text-slate-300 placeholder:text-slate-600"
                        />
                        <button type="submit" disabled={!operatorMessage} className="text-slate-400 hover:text-white disabled:opacity-30">
                            <Send className="h-3 w-3" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-50 h-6 bg-[#020617] border-t border-slate-800 flex items-center justify-between px-4 text-[9px] text-slate-600 uppercase tracking-widest">
        <span>{brandConfig.name} Safety Systems // ISO 45001 COMPLIANT</span>
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><Signal className="h-2 w-2" /> 4G LTE</span>
            <span className="flex items-center gap-1"><Radio className="h-2 w-2" /> MESH LINK</span>
        </div>
      </footer>

      {/* FULL SCREEN RED FLASH ON CRITICAL INTERVENTION */}
      <AnimatePresence>
        {isAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="pointer-events-none absolute inset-0 z-[100] bg-red-500 mix-blend-color-dodge"
          />
        )}
      </AnimatePresence>
    </main>
  );
}
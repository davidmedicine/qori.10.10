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

// Adjusted Route path to ensure it stays centered and visible
// M(Start) ... C(Curve1) ... C(Curve2) ... (End)
const ROUTE_PATH_D =
  'M 750 100 C 680 180 580 250 460 280 C 380 310 280 350 220 390 C 180 420 150 460 130 490';

const SILENT_ZONE_RANGE = { start: 0.42, end: 0.72 };

const SYSTEM_LOGS = [
  { t: 12, msg: 'AVISO: Pérdida de enlace 4G. Cambiando a soberano.', type: 'warning' },
  { t: 13, msg: 'HARDWARE: Modo Soberano activado. Grabación local.', type: 'action' },
  { t: 15, msg: 'ALERTA: Desviación térmica detectada (+2σ)', type: 'error' },
  { t: 16, msg: 'DIAGNÓSTICO: Ejecutando análisis de sensores...', type: 'info' },
  { t: 19, msg: 'FALLA CONFIRMADA: Compresor Secundario', type: 'error' },
  { t: 22, msg: 'ACCIÓN: SMS local enviado a conductor (Unidad #404)', type: 'action' },
  { t: 32, msg: 'PROTOCOL QORI: Iniciando compensación térmica', type: 'info' },
  { t: 38, msg: 'RESULTADO: Sistema estabilizado. Alerta activa.', type: 'success' },
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

// --- SUB-COMPONENTS (Defined outside to prevent re-render flickering) ---

const TopHeader = React.memo(({ isOffline, isSystemAlert }: { isOffline: boolean; isSystemAlert: boolean }) => (
  <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#080808] px-6 shadow-md shrink-0 z-20">
    <div className="flex items-baseline gap-4">
      <h1 className="text-3xl font-black tracking-tighter text-white">RANSA</h1>
      <span className="text-xs font-medium tracking-[0.2em] text-gray-500 hidden md:inline-block">
        SISTEMA DE MONITOREO OFFLINE
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-widest border-emerald-500/40 bg-emerald-900/10 text-emerald-300">
        <Cpu className="h-3.5 w-3.5" /> SISTEMA: ONLINE
      </div>

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

      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest transition-colors duration-500 ${
          isSystemAlert
            ? 'border-red-500 bg-red-900/30 text-red-300 shadow-[0_0_10px_rgba(220,38,38,0.4)]'
            : 'border-emerald-500/30 bg-emerald-900/10 text-emerald-300'
        }`}
      >
        {isSystemAlert ? (
          <>
            <AlertTriangle className="h-4 w-4 animate-pulse" /> ALERTA ACTIVA
          </>
        ) : (
          <>
            <Activity className="h-4 w-4" /> ESTADO ESTABLE
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
  journeyPosition 
}: { 
  isOffline: boolean; 
  isSystemAlert: boolean; 
  journeyPosition: number; 
}) => (
  // Moved to TOP LEFT to avoid covering the destination (Lima) at bottom left
  <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
    <div className="flex flex-wrap gap-4">
      <div className="rounded-lg border border-white/10 bg-black/80 p-3 backdrop-blur shadow-lg shadow-emerald-500/10">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="h-4 w-4" /> Coordenadas
        </div>
        <div className="font-mono tabular-nums text-sm text-white">13.532° S, 71.967° W</div>
      </div>
      {isOffline && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-900/25 p-3 text-orange-200 backdrop-blur shadow-lg shadow-orange-500/10">
          <HardDrive className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wide">GRABACIÓN LOCAL ACTIVA</span>
        </div>
      )}
    </div>
    <div className="rounded-xl border border-white/10 bg-black/70 p-3 shadow-lg shadow-emerald-500/10 backdrop-blur w-64">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400">
        <span className={`text-[10px] font-bold ${isSystemAlert ? 'text-red-400' : 'text-emerald-300'}`}>
          {isSystemAlert ? 'RUTA EN EMERGENCIA' : 'RUTA EN CURSO'}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <span className="font-mono tabular-nums text-[11px] text-gray-200">
          {Math.round(Math.min(Math.max(journeyPosition, 0), 1) * 100)}%
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 ${
            isSystemAlert
              ? 'bg-gradient-to-r from-orange-400 via-red-500 to-red-700'
              : 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500'
          }`}
          style={{ width: `${Math.min(Math.max(journeyPosition, 0), 1) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function RansaResearchConsole() {
  const seconds = useStoryClock();
  const [operatorMessage, setOperatorMessage] = useState('');
  const [userMessages, setUserMessages] = useState<{ id: number; msg: string; ts: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const routePathRef = useRef<SVGPathElement | null>(null);
  const routeLengthRef = useRef(0);
  const isMountedRef = useRef(false);

  // Motion values to avoid per-frame React state
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

  useEffect(() => {
    if (seconds === 0) setUserMessages([]);
  }, [seconds]);

  const handleSend = () => {
    const message = operatorMessage.trim();
    if (!message) return;
    setUserMessages((prev) => [...prev, { id: Date.now(), msg: message, ts: seconds }]);
    setOperatorMessage('');
  };

  // Phase Logic
  const phase: Phase = useMemo(() => {
    if (seconds < 12) return 'NORMAL';
    if (seconds < 15) return 'BLIND';
    return 'INCIDENT';
  }, [seconds]);

  const isOffline = phase === 'BLIND' || phase === 'INCIDENT';
  const isSystemAlert = phase === 'INCIDENT';

  // Simulation Values
  const journeyProgress = Math.min(seconds / STORY_DURATION, 1); // Clamp to 1 to prevent overshoot
  const incidentProgress = Math.min(Math.max((seconds - 15) / 35, 0), 1);

  const temperature = useMemo(() => {
    const seed = seconds + (isSystemAlert ? 50 : 0);
    let base = 2.0;
    if (phase === 'BLIND') base = 2.2;
    if (isSystemAlert) {
      const spike = 4.8;
      const target = 3.5;
      base = spike - (spike - target) * incidentProgress;
    }
    return Math.max(1.8, Math.min(5.0, base + noise(seed, 0.1)));
  }, [incidentProgress, isSystemAlert, phase, seconds]);

  const speed = useMemo(() => {
    const seed = seconds + 200;
    const inZone = journeyProgress >= SILENT_ZONE_RANGE.start && journeyProgress <= SILENT_ZONE_RANGE.end;
    let target = 65;
    if (inZone) target = 45;
    if (isSystemAlert) target = 25;
    return Math.max(0, target + noise(seed, 2));
  }, [isSystemAlert, journeyProgress, seconds]);

  // Prepare route length once mounted
  useEffect(() => {
    if (!mounted) return;
    const el = routePathRef.current;
    if (!el) return;
    routeLengthRef.current = el.getTotalLength();
    // Initialize truck position on mount
    const len = routeLengthRef.current;
    const point = el.getPointAtLength(Math.min(journeyProgress * len, len - 0.1));
    const nextPoint = el.getPointAtLength(Math.min(journeyProgress * len + 1, len));
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set((Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI);
    smoothJourney.set(journeyProgress);
  }, [journeyProgress, mounted, smoothJourney, truckRotation, truckX, truckY]);

  // Smooth animation of journey progress
  useEffect(() => {
    const controls = animate(smoothJourney, journeyProgress, { duration: 0.9, ease: 'linear' });
    return controls.stop;
  }, [journeyProgress, smoothJourney]);

  // Imperative truck transform updates using motion values (no React state)
  useMotionValueEvent(smoothJourney, 'change', (latest) => {
    if (!isMountedRef.current) return;
    const path = routePathRef.current;
    if (!path) return;
    const len = routeLengthRef.current || path.getTotalLength();
    routeLengthRef.current = len;
    const clamped = Math.min(Math.max(latest, 0), 1);
    const dist = Math.min(clamped * len, len - 0.1);
    const point = path.getPointAtLength(dist);
    const nextPoint = path.getPointAtLength(Math.min(dist + 1, len));
    const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;
    truckX.set(point.x);
    truckY.set(point.y);
    truckRotation.set(angle);
  });

  // Logs Logic
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

  // Visuals
  const dayCycle = Math.sin((seconds / STORY_DURATION) * Math.PI);
  const mapGradient = isSystemAlert
    ? 'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.15), rgba(5,5,5,1))'
    : `radial-gradient(circle at 50% 50%, rgba(10,30,60,${0.3 + dayCycle * 0.2}), rgba(5,5,5,1))`;

  if (!mounted) return null;

  return (
    <main className="flex h-screen w-screen flex-col bg-black text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      
      <TopHeader isOffline={isOffline} isSystemAlert={isSystemAlert} />

      {/* CONTENT GRID */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: MAP */}
        <div className="relative flex-[1.8] overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#050b10] via-[#030509] to-[#010102]">
          <div
            className="absolute inset-0 transition-all duration-[2000ms]"
            style={{ background: mapGradient }}
          />

          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

          {/* Map SVG - Updated ViewBox to fit everything vertically */}
          <div className="absolute inset-0 p-4">
            <svg viewBox="0 0 900 580" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity="0.4" />
                  <stop offset="50%" stopColor={BRAND_ORANGE} stopOpacity="1" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Terrain / Dead Zone */}
              <rect x="400" y="100" width="300" height="300" fill="url(#routeGradient)" fillOpacity="0.03" rx="20" />
              {isOffline && (
                <g>
                   <text x="550" y="130" textAnchor="middle" className="fill-white/20 text-xs font-bold tracking-[0.3em]">ZONA SIN SEÑAL</text>
                   <text x="550" y="150" textAnchor="middle" className="fill-orange-500/50 text-[10px] font-mono tracking-[0.1em]">COBERTURA 4G: 0%</text>
                </g>
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

              {/* Cities - Adjusted positions to match Path */}
              {[
                { x: 750, y: 100, name: "CUSCO", alt: "3400 m", align: "middle" },
                { x: 460, y: 280, name: "NAZCA", alt: "520 m", align: "middle" },
                { x: 130, y: 490, name: "LIMA", alt: "0 m", align: "start" } // Lima at the end
              ].map(city => (
                <g key={city.name}>
                  <circle cx={city.x} cy={city.y} r={8} fill="#000" stroke="white" strokeWidth={3} />
                  <text x={city.x} y={city.y - 20} textAnchor="middle" className="fill-white text-xl font-bold tracking-widest drop-shadow-md">{city.name}</text>
                  <text x={city.x} y={city.y + 25} textAnchor="middle" className="fill-gray-400 text-xs font-mono">{city.alt}</text>
                </g>
              ))}

              {/* The Real Truck Icon */}
              <motion.g
                style={{
                  x: truckX,
                  y: truckY,
                  rotate: truckRotation,
                  filter: isSystemAlert
                    ? 'drop-shadow(0 0 14px rgba(239,68,68,0.75))'
                    : 'drop-shadow(0 0 12px rgba(16,185,129,0.7))',
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 20, mass: 0.5 }}
              >
                {/* Pulse Effect */}
                <motion.circle
                  r={40}
                  fill={isSystemAlert ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.1)'}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <g transform="translate(-30, -20)">
                  <rect x="4" y="10" width="46" height="20" rx="4" fill={isSystemAlert ? '#ef4444' : '#22c55e'} stroke="#0b0b0b" strokeWidth="1.5" />
                  <rect x="34" y="4" width="20" height="14" rx="3" fill={isSystemAlert ? '#fb923c' : '#a7f3d0'} stroke="#0b0b0b" strokeWidth="1" />
                  <rect x="50" y="14" width="10" height="12" rx="2" fill="#111827" stroke="#0b0b0b" strokeWidth="1" />
                  <path d="M8 16h30" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 20h12" stroke="rgba(0,0,0,0.35)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="20" cy="32" r="5.5" fill="#0b0b0b" stroke="white" strokeWidth="2" />
                  <circle cx="42" cy="32" r="5.5" fill="#0b0b0b" stroke="white" strokeWidth="2" />
                  <circle cx="52" cy="12" r="2" fill={isSystemAlert ? '#fca5a5' : '#bbf7d0'} />
                </g>
              </motion.g>
            </svg>

            <MapOverlayUI isOffline={isOffline} isSystemAlert={isSystemAlert} journeyPosition={journeyProgress} />
          </div>
        </div>

        {/* RIGHT PANEL: CONTROL */}
        <div className="flex-1 border-l border-white/10 flex flex-col bg-[#0A0A0A]">
          <AnimatePresence mode="wait" initial={false}>
            
            {/* STATE A: NORMAL / BLIND */}
            {!isSystemAlert ? (
              <motion.div
                key="normal-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex h-full flex-col items-center justify-center gap-8 p-8 relative"
              >
                <div className="relative flex items-center justify-center">
                  {/* HUD Rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-12 rounded-full border border-dashed border-white/10"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-24 rounded-full border border-white/5 opacity-50"
                  />

                  <div className="relative z-10">
                    <Truck className="h-40 w-40 text-emerald-500/80 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={0.8} />
                  </div>

                  <div className="absolute -right-24 top-0 text-right">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-500">VELOCIDAD</span>
                    <div className="flex items-baseline justify-end gap-1">
                      <AnimatedNumber value={speed} decimals={0} className="text-4xl font-bold font-mono tabular-nums text-white" />
                      <span className="text-xs text-gray-400">km/h</span>
                    </div>
                  </div>
                  <div className="absolute -left-24 bottom-0 text-left">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-500">CARGA</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <AnimatedNumber value={temperature} decimals={1} className="text-4xl font-bold font-mono tabular-nums text-white" />
                      <span className="text-xs text-gray-400">°C</span>
                    </div>
                  </div>
                </div>
                <div className="text-center z-10 mt-8">
                  <h2 className="text-2xl font-medium text-white tracking-widest">UNIDAD R-240</h2>
                  <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-2">
                    {isOffline ? (
                      <span className="text-orange-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                        <HardDrive className="h-4 w-4" /> Modo Soberano (Local)
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Monitoreo Satelital Activo
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* STATE B: INCIDENT RESPONSE */
              <motion.div
                key="emergency-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex h-full w-full flex-col gap-2 p-2"
              >
                {/* Top: Emergency Header (Non-Flashing Text) */}
                <div className="shrink-0 flex items-center justify-between rounded-t-xl border-l-4 border-l-red-500 bg-red-950/10 p-5 backdrop-blur-sm border-y border-r border-white/5">
                  <div className="flex items-center gap-4">
                    {/* Only the ICON container pulses, not the text */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 animate-pulse">
                      <Thermometer className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-red-400 tracking-widest uppercase">Temperatura Crítica</div>
                      <div className="text-3xl font-bold font-mono tabular-nums text-white leading-none mt-1">
                        <AnimatedNumber value={temperature} decimals={1} unit="°C" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-500 tracking-widest">VELOCIDAD ACTUAL</div>
                    <AnimatedNumber value={speed} decimals={0} unit="km/h" className="text-xl font-mono tabular-nums text-white" />
                  </div>
                </div>

                {/* Bottom: Chat Interface */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border border-white/10 bg-black/40 shadow-2xl">
                  
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold tracking-wider text-white font-mono">IA QORI: TERMINAL SEGURO</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-500/70 font-mono uppercase">Hardware Local</span>
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
                            <span>{isUser ? 'OPERADOR HUMANO' : `SISTEMA [T+${log.ts}s]`}</span>
                          </div>
                          <span className="leading-relaxed whitespace-pre-wrap">{log.msg}</span>
                        </motion.div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Area */}
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
                        placeholder="Escribir comando de caja negra..."
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
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="relative z-50 flex h-10 items-center justify-center overflow-hidden bg-yellow-500/10 text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-600">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #EAB308 10px, #EAB308 20px)' }} />
        <span className="relative bg-black px-4 py-1 text-yellow-500">
          QORI LABS PILOT · MODO DEMOSTRACIÓN · DATOS SIMULADOS
        </span>
      </footer>

      {/* Critical Alert Overlay (Flash) - Only flashes red bg, not text */}
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

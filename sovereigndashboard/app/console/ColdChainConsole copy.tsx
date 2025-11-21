'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Cloud, Cpu, HardDrive, MessageSquare, ShieldCheck, Truck, WifiOff } from 'lucide-react';

type ViewMode = 'OPERATIVA' | 'COMUNITARIA';

const STORY_TOTAL_SECONDS = 60;
const BRAND_GREEN = '#009B3A';
const BRAND_ORANGE = '#F58220';
const ALARM_RED = '#DC2626';

const ROUTE_PATH_D =
  'M 720 110 C 650 170 560 230 460 280 C 380 320 300 350 240 380 C 200 400 170 430 150 460';

const SILENT_ZONE_RANGE = { start: 0.42, end: 0.72 };

const protocolSteps: { label: string; at: number; icon: 'diag' | 'sms' | 'check' }[] = [
  { label: 'ANOMALÍA TÉRMICA DETECTADA', at: 15, icon: 'diag' },
  { label: 'DIAGNÓSTICO LOCAL: COMPRESOR', at: 18, icon: 'diag' },
  { label: 'SMS ENVIADO: "ALERTA CABINA"', at: 20, icon: 'sms' },
  { label: 'CONFIRMACIÓN CONDUCTOR RECIBIDA', at: 25, icon: 'sms' },
  { label: 'REINICIO AUTOMÁTICO ACTIVADO', at: 30, icon: 'check' },
];

const noise = (seed: number, amplitude: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * amplitude;
};

function useStoryClock() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s + 1) % STORY_TOTAL_SECONDS), 1000);
    return () => window.clearInterval(id);
  }, []);

  return seconds;
}

const ColdChainConsole: React.FC = () => {
  const seconds = useStoryClock();
  const [view, setView] = useState<ViewMode>('OPERATIVA');

  const routePathRef = useRef<SVGPathElement | null>(null);
  const [truckPos, setTruckPos] = useState<{ x: number; y: number; angle: number } | null>(null);

  const isNormal = seconds < 10;
  const isBlindSpot = seconds >= 10 && seconds < 15;
  const isIncident = seconds >= 15 && seconds < 55;
  const isReset = seconds >= 55;

  const journeyProgress = seconds / STORY_TOTAL_SECONDS;
  const incidentProgress = Math.min(Math.max((seconds - 15) / 40, 0), 1);

  const temperature = useMemo(() => {
    const seed = seconds + (isIncident ? 30 : 0);
    if (isNormal) return 2.0 + noise(seed, 0.04);
    if (isBlindSpot) return 2.1 + noise(seed, 0.05);
    if (isIncident) {
      const start = 4.3;
      const end = 2.1;
      const temp = start - (start - end) * incidentProgress + noise(seed, 0.08);
      return Math.max(2, Math.min(4.4, temp));
    }
    return 2.0 + noise(seed, 0.03);
  }, [incidentProgress, isBlindSpot, isIncident, isNormal, seconds]);

  const speedKph = useMemo(() => {
    const seed = seconds + 100;
    const inCommunity = journeyProgress >= SILENT_ZONE_RANGE.start && journeyProgress <= SILENT_ZONE_RANGE.end;
    const target = isIncident ? 32 : 60;
    const adjusted = inCommunity ? 28 : target;
    return Math.max(24, Math.min(62, adjusted + noise(seed, 1.6)));
  }, [isIncident, journeyProgress, seconds]);

  useEffect(() => {
    const pathEl = routePathRef.current;
    if (!pathEl) return;
    const length = pathEl.getTotalLength();
    if (!length) return;
    const targetLength = journeyProgress * length;
    const point = pathEl.getPointAtLength(targetLength);
    const ahead = pathEl.getPointAtLength(Math.min(targetLength + 1, length));
    const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
    setTruckPos({ x: point.x, y: point.y, angle });
  }, [journeyProgress]);

  const ringColor = isIncident ? ALARM_RED : BRAND_GREEN;
  const guardianLabel = isIncident || isBlindSpot ? 'SISTEMA: NODO QORI (LOCAL)' : 'SISTEMA: RANSA 360 (CLOUD)';
  const guardianText = isIncident
    ? 'DETECTANDO ANOMALÍA...'
    : isBlindSpot
    ? 'MONITOREO ACTIVO (OFFLINE)'
    : isReset
    ? 'MONITOREO ACTIVO'
    : 'MONITOREO ACTIVO';

  const displayValue = view === 'OPERATIVA' ? temperature.toFixed(1) : speedKph.toFixed(0);
  const displayUnit = view === 'OPERATIVA' ? '°C' : 'km/h';
  const displayLabel = view === 'OPERATIVA' ? 'Temperatura de carga' : 'Velocidad comunitaria (30 km/h)';
  const compliant = view === 'COMUNITARIA' && speedKph <= 30;

  const trendArrow = isIncident ? '↓' : isBlindSpot ? '→' : '→';
  const trendCopy = isIncident ? 'IA reduciendo temperatura' : isBlindSpot ? 'En zona de silencio' : 'Estable';

  const silentZoneY = `${SILENT_ZONE_RANGE.start * 100}%`;
  const silentZoneHeight = `${(SILENT_ZONE_RANGE.end - SILENT_ZONE_RANGE.start) * 100}%`;

  return (
    <main
      className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-4"
      style={{
        fontFamily: '"Inter", "SF Pro Display", "SF Pro Text", system-ui, -apple-system, sans-serif',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div className="relative w-full max-w-6xl rounded-3xl border border-white/5 bg-[#050505] overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.75)] max-h-[800px]">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ backgroundColor: isIncident ? 'rgba(220,38,38,0.15)' : 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">RANSA 360 · MÓDULO OFFLINE</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Corredor Cusco → Nazca → Lima</h1>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                  isBlindSpot || isIncident
                    ? 'border-red-500/40 bg-red-900/20 text-red-400'
                    : 'border-emerald-500/40 bg-emerald-900/20 text-emerald-400'
                }`}
              >
                <Cloud className="h-4 w-4" />
                <span>{isBlindSpot || isIncident ? 'NUBE: SIN SEÑAL' : 'NUBE: ONLINE'}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-900/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                <Brain className="h-4 w-4" />
                <span>Nodo Qori</span>
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">[T+{seconds.toString().padStart(2, '0')}s]</div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-5 py-4 md:grid-cols-[1.6fr_1fr] items-stretch">
          {/* MAPA */}
          <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0a0d12]">
            <div
              className="absolute inset-0"
              aria-hidden
              style={{
                background:
                  isIncident && !isNormal
                    ? 'radial-gradient(circle at 50% 40%, rgba(220,38,38,0.18), transparent 45%), radial-gradient(circle at 15% 20%, rgba(0,155,58,0.14), transparent 40%)'
                    : isReset
                    ? 'radial-gradient(circle at 50% 40%, rgba(0,155,58,0.18), transparent 45%), radial-gradient(circle at 15% 20%, rgba(0,155,58,0.14), transparent 40%)'
                    : 'radial-gradient(circle at 15% 20%, rgba(0,155,58,0.12), transparent 40%), radial-gradient(circle at 80% 10%, rgba(245,130,32,0.12), transparent 40%)',
              }}
            />

            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">Ruta andina</p>
                <p className="text-lg font-semibold text-white">Cusco · Nazca · Lima</p>
                <p className="text-sm text-gray-400">{isIncident ? 'INCIDENTE EN PROGRESO' : isBlindSpot ? 'Zona sin señal · Offline' : 'Enlace estable'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Estado</p>
                <p className={`text-sm ${isIncident ? 'text-red-300' : 'text-emerald-300'}`}>
                  {isIncident ? 'Respuesta autónoma activa' : 'Cadena estable'}
                </p>
              </div>
            </div>

            <div className="relative h-[280px]">
              <svg viewBox="0 0 900 520" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="coast" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0b1728" />
                    <stop offset="100%" stopColor="#06080e" />
                  </linearGradient>
                  <linearGradient id="andes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f1d30" />
                    <stop offset="100%" stopColor="#0b1220" />
                  </linearGradient>
                  <linearGradient id="routeGlow" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity="0.9" />
                    <stop offset="60%" stopColor={BRAND_ORANGE} stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
                  </filter>
                </defs>

                {/* Topografía estilizada */}
                <path d="M 90 30 C 140 120 150 230 120 350 C 150 430 190 470 260 500 L 90 500 Z" fill="url(#coast)" opacity="0.9" />
                <path d="M 260 60 C 420 120 560 220 720 260 C 820 290 880 340 900 520 L 260 520 Z" fill="url(#andes)" opacity="0.9" />

                {/* Curvas topográficas */}
                <path d="M 120 140 C 240 180 360 200 520 230 C 700 260 800 270 900 300" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="8 10" />
                <path d="M 160 220 C 320 240 460 260 620 290 C 760 320 840 340 900 360" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="8 10" />
                <path d="M 200 300 C 360 320 520 340 680 360 C 800 380 870 400 900 420" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="6 10" />

                {/* Zona sin señal en montaña */}
                <g filter="url(#softBlur)">
                  <rect
                    x="430"
                    y="120"
                    width="260"
                    height="240"
                    rx="50"
                    fill="rgba(245,130,32,0.12)"
                  />
                </g>
                <text x="560" y="180" textAnchor="middle" className="fill-gray-300 text-[12px] tracking-[0.2em]">
                  ZONA SIN SEÑAL
                </text>
                <text x="560" y="200" textAnchor="middle" className="fill-gray-500 text-[10px]">
                  MODO SOBERANO
                </text>

                {/* Ruta */}
                <motion.path
                  d={ROUTE_PATH_D}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                <motion.path
                  d={ROUTE_PATH_D}
                  ref={routePathRef}
                  fill="none"
                  stroke="url(#routeGlow)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4 }}
                />
                <motion.path
                  d={ROUTE_PATH_D}
                  fill="none"
                  stroke={view === 'OPERATIVA' ? '#ffffff' : BRAND_ORANGE}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="12 14"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ repeat: Infinity, repeatType: 'loop', duration: view === 'OPERATIVA' ? 3.6 : 4.8, ease: 'linear' }}
                  opacity={0.8}
                />

                {/* Truck */}
                {truckPos && (
                  <motion.g
                    initial={false}
                    animate={{ x: truckPos.x, y: truckPos.y, rotate: truckPos.angle }}
                    transition={{ ease: 'linear', duration: 0.4 }}
                  >
                    <g transform="translate(-16 -16)">
                      <motion.circle
                        r={18}
                        fill="none"
                        stroke={isIncident ? ALARM_RED : BRAND_GREEN}
                        strokeWidth={1.5}
                        animate={{ scale: isIncident ? [1, 1.25, 1] : [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: isIncident ? 1.2 : 1.8, ease: 'easeInOut' }}
                      />
                      <circle r={14} fill={isIncident ? ALARM_RED : BRAND_GREEN} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                      <Truck width={16} height={16} color="#0b0b0b" />
                    </g>
                  </motion.g>
                )}

                {/* Silent zone overlay aligned to progress */}
                <rect
                  x="0"
                  y={silentZoneY}
                  width="100%"
                  height={silentZoneHeight}
                  fill="rgba(245,130,32,0.06)"
                  className="transition-opacity"
                />

                {/* Cities */}
                <g>
                  <circle cx={720} cy={110} r={10} fill="#0a0a0a" stroke="#66ffb2" strokeWidth={2} />
                  <text x={720} y={90} textAnchor="middle" className="fill-white text-[12px]">
                    CUSCO
                  </text>
                  <text x={720} y={130} textAnchor="middle" className="fill-gray-400 text-[10px]">
                    3400 m
                  </text>
                </g>
                <g>
                  <circle cx={460} cy={280} r={10} fill="#0a0a0a" stroke={BRAND_ORANGE} strokeWidth={2} />
                  <text x={460} y={260} textAnchor="middle" className="fill-white text-[12px]">
                    NAZCA
                  </text>
                  <text x={460} y={300} textAnchor="middle" className="fill-gray-400 text-[10px]">
                    520 m
                  </text>
                </g>
                <g>
                  <circle cx={180} cy={430} r={10} fill="#0a0a0a" stroke="#ffffff" strokeWidth={2} />
                  <text x={180} y={410} textAnchor="middle" className="fill-white text-[12px]">
                    LIMA
                  </text>
                  <text x={180} y={450} textAnchor="middle" className="fill-gray-400 text-[10px]">
                    Costa · 0 m
                  </text>
                </g>
              </svg>

              {/* Black box indicator */}
              <AnimatePresence>
                {(isBlindSpot || isIncident) && (
                  <motion.div
                    key="blackbox"
                    className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: BRAND_ORANGE }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                    />
                    <HardDrive className="h-4 w-4 text-orange-300" />
                    <span className="text-orange-200">GRABANDO EN DISCO LOCAL (ENCRIPTADO)</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 pb-5 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-8 rounded-full" style={{ backgroundColor: BRAND_GREEN }} />
                <span>Cadena en frío protegida</span>
              </div>
              <div className="flex items-center gap-2">
                {isBlindSpot || isIncident ? <WifiOff className="h-4 w-4 text-gray-400" /> : <Cloud className="h-4 w-4 text-white" />}
                <span>{isBlindSpot || isIncident ? 'Modo offline · Zona sin señal' : 'Conectado a Ransa 360'}</span>
              </div>
            </div>
          </section>

          {/* PULSO SOBERANO */}
          <section className="relative flex flex-col items-center rounded-2xl border border-white/8 bg-[#0c0f15] px-4 py-5 text-center">
            <div className="flex items-center justify-between w-full text-xs uppercase tracking-[0.22em] text-gray-400">
              <span>{guardianLabel}</span>
              <div className="flex items-center gap-2 text-white">
                <Cloud className={isBlindSpot || isIncident ? 'h-5 w-5 text-gray-600' : 'h-5 w-5 text-white'} />
                <Brain className={isBlindSpot || isIncident ? 'h-5 w-5 text-[#009B3A]' : 'h-5 w-5 text-white/70'} />
              </div>
            </div>

            <motion.div
              className="relative mt-8 flex items-center justify-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: isIncident ? '0 0 120px rgba(220,38,38,0.35)' : `0 0 120px ${ringColor}44`,
                  scale: isIncident ? [1, 1.04, 1] : 1,
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
                <div className="absolute inset-6 rounded-full" style={{ boxShadow: `0 0 0 12px ${ringColor}1f` }} />
                <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${ringColor}` }} />

                <div className="relative flex flex-col items-center gap-2">
                  {isIncident && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                      <ShieldCheck className="h-5 w-5" /> PROTOCOLO AUTÓNOMO ACTIVO
                    </div>
                  )}
                  <div className="text-sm uppercase tracking-[0.22em] text-gray-400">{displayLabel}</div>
                  <div className="flex items-baseline gap-3 text-7xl md:text-8xl font-semibold leading-none">
                    <motion.span
                      key={displayValue}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {displayValue}
                    </motion.span>
                    <span className="text-3xl text-gray-500">{displayUnit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className={isIncident ? 'text-red-300' : 'text-emerald-200'}>{guardianText}</span>
                    <span className="text-xs text-gray-400">{trendArrow} {trendCopy}</span>
                  </div>
                  {view === 'COMUNITARIA' && (
                    <div className={`text-sm ${compliant ? 'text-emerald-300' : 'text-red-300'}`}>
                      {compliant ? 'SAFE / COMPLIANT' : 'Excede límite comunitario'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Autonomous protocol feed */}
            <div className="mt-4 w-full text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Protocolo autónomo</p>
              <div className="relative max-h-40 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="flex flex-col-reverse">
                  <AnimatePresence initial={false}>
                    {protocolSteps
                      .filter((step) => seconds >= step.at && seconds < 55)
                      .map((step) => (
                        <motion.div
                          key={step.label}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="mx-2 my-1 rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                        >
                          <div className="flex items-center gap-2">
                            {step.icon === 'sms' ? (
                              <MessageSquare className="h-4 w-4 text-emerald-300" />
                            ) : step.icon === 'diag' ? (
                              <Cpu className="h-4 w-4 text-orange-300" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-emerald-300" />
                            )}
                            <span className="text-emerald-100 text-[13px]">[✓] {step.label}</span>
                          </div>
                          {step.icon === 'sms' && (
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${BRAND_GREEN}, ${BRAND_ORANGE})` }}
                                animate={{ x: ['-30%', '110%'] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ringColor }} />
                  <span>{isIncident ? 'Intervención autónoma en curso' : 'Cadena estable'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-gray-500">
                <button
                  type="button"
                  onClick={() => setView('OPERATIVA')}
                  className={`px-4 py-2 rounded-full ${view === 'OPERATIVA' ? 'bg-white text-black' : 'bg-white/5 text-white'}`}
                >
                  Corporativa
                </button>
                <button
                  type="button"
                  onClick={() => setView('COMUNITARIA')}
                  className={`px-4 py-2 rounded-full ${view === 'COMUNITARIA' ? 'bg-white text-black' : 'bg-white/5 text-white'}`}
                >
                  Comunitaria
                </button>
              </div>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {isIncident && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              style={{ boxShadow: '0 0 180px rgba(220,38,38,0.12) inset' }}
            />
          )}
        </AnimatePresence>

        <div className="pb-3 text-center text-[11px] uppercase tracking-[0.24em] text-gray-600">
          DEMOSTRACIÓN TÉCNICA · DATOS SIMULADOS · QORI LABS PILOT
        </div>
      </div>
    </main>
  );
};

export default ColdChainConsole;

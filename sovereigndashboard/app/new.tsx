'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Cloud, ShieldCheck, Truck, WifiOff } from 'lucide-react';

type Phase = 1 | 2 | 3 | 4;
type ViewMode = 'OPERATIVA' | 'COMUNITARIA';

const STORY_TOTAL_SECONDS = 60;
const PHASE_LENGTH_SECONDS = 15;
const SILENT_ZONE_START = 0.35;
const SILENT_ZONE_END = 0.65;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getPhaseFromSecond = (second: number): Phase => {
  const s = second % STORY_TOTAL_SECONDS;
  if (s < PHASE_LENGTH_SECONDS) return 1; // Normal
  if (s < PHASE_LENGTH_SECONDS * 2) return 2; // Zona de silencio
  if (s < PHASE_LENGTH_SECONDS * 3) return 3; // Peligro
  return 4; // Recuperación
};

const phaseCopy: Record<Phase, { title: string; note: string }> = {
  1: { title: 'Tránsito normal', note: 'Nube activa · Cadena estable' },
  2: { title: 'Zona sin señal', note: 'Modo offline · Nodo local protegiendo' },
  3: { title: 'Excursión térmica', note: 'Temperatura alta · Atención inmediata' },
  4: { title: 'Recuperación IA', note: 'IA corrigiendo · Volviendo a 2.0°C' },
};

const noise = (seed: number, amplitude: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * amplitude;
};

function useSovereignPulse() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setSeconds((s) => (s + 1) % STORY_TOTAL_SECONDS),
      1000
    );
    return () => window.clearInterval(id);
  }, []);

  const phase = getPhaseFromSecond(seconds);
  const journeyProgress = seconds / STORY_TOTAL_SECONDS;
  const phaseProgress = (seconds % PHASE_LENGTH_SECONDS) / PHASE_LENGTH_SECONDS;

  const temperature = useMemo(() => {
    const seed = seconds + phase * 10;
    if (phase === 1) return 2 + noise(seed, 0.06);
    if (phase === 2) return 2.1 + noise(seed, 0.06);
    if (phase === 3) return 4.2 + noise(seed, 0.1);
    // Recuperación: cae suavemente de 4.2 a 2.0
    const recovering = 4.2 - phaseProgress * 2.4 + noise(seed, 0.05);
    return clamp(recovering, 2, 4.2);
  }, [phase, phaseProgress, seconds]);

  const speedKph = useMemo(() => {
    const base = phase === 3 ? 35 : phase === 4 ? 32 : 60;
    const inCommunity = journeyProgress >= SILENT_ZONE_START && journeyProgress <= SILENT_ZONE_END;
    const target = inCommunity ? 28 : base;
    return clamp(target + noise(seconds + 100, 1.8), 24, 62);
  }, [journeyProgress, phase, seconds]);

  return { phase, seconds, journeyProgress, temperature, speedKph };
}

const ColdChainConsole: React.FC = () => {
  const { phase, seconds, journeyProgress, temperature, speedKph } = useSovereignPulse();
  const [view, setView] = useState<ViewMode>('OPERATIVA');

  const isOffline = phase >= 2;
  const isDanger = phase === 3;
  const isRecovering = phase === 4;

  const statusColor = isDanger ? '#EF4444' : '#10B981';
  const guardianLabel = isOffline ? 'PROTECCIÓN: NODO LOCAL' : 'PROTECCIÓN: NUBE';
  const guardianCopy = isOffline ? 'MODO OFFLINE: PROTEGIDO' : 'ENLACE CLOUD ACTIVO';

  const displayValue = view === 'OPERATIVA' ? temperature.toFixed(1) : speedKph.toFixed(0);
  const displayUnit = view === 'OPERATIVA' ? '°C' : 'km/h';
  const displayLabel = view === 'OPERATIVA' ? 'Temperatura de carga' : 'Velocidad (límite 30)';

  const topProgress = clamp(journeyProgress, 0, 1) * 100;
  const compliance = view === 'COMUNITARIA' && speedKph <= 30;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-5xl rounded-3xl bg-black px-4 py-6 md:px-10 md:py-10">
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          aria-hidden
          animate={{ backgroundColor: isDanger ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">QORI · SOVEREIGN PULSE</p>
            <h1 className="text-lg md:text-2xl font-semibold text-white">Corredor Cusco → Callao</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Cloud className={isOffline ? 'h-5 w-5 text-gray-600' : 'h-5 w-5 text-white'} />
              {isOffline ? 'Cloud: Fuera de línea' : 'Cloud: Conectada'}
            </span>
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400" /> Nodo Qori
            </span>
          </div>
        </div>

        <section className="mt-8 grid gap-10 md:grid-cols-2">
          {/* Contexto: Trayecto vertical */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-gray-500">Historia</p>
                <p className="text-white text-base">{phaseCopy[phase].title}</p>
                <p className="text-gray-400 text-sm">{phaseCopy[phase].note}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.26em] text-gray-500">Tiempo</p>
                <p className="text-white font-mono">[T+{seconds.toString().padStart(2, '0')}s]</p>
              </div>
            </div>

            <div className="relative flex-1 min-h-[420px]">
              <div className="absolute inset-x-1/2 top-6 bottom-6 -translate-x-1/2">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/12" />

                {/* Zona sin señal */}
                <div
                  className="absolute left-1/2 w-24 -translate-x-1/2 rounded-2xl bg-gray-800/60"
                  style={{
                    top: `${SILENT_ZONE_START * 100}%`,
                    height: `${(SILENT_ZONE_END - SILENT_ZONE_START) * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 border border-gray-700/40 rounded-2xl" />
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 text-xs text-gray-300">
                    ZONA SIN SEÑAL
                    <div className="text-[11px] text-gray-500">NO 4G</div>
                  </div>
                </div>

                {/* Camión */}
                <motion.div
                  className="absolute left-1/2 h-14 w-14 -translate-x-1/2"
                  style={{ top: `${topProgress}%` }}
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="h-full w-full rounded-full bg-white/5 flex items-center justify-center"
                    animate={{
                      boxShadow: isDanger
                        ? '0 0 35px rgba(239,68,68,0.4)'
                        : '0 0 28px rgba(16,185,129,0.3)',
                      scale: isDanger ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isDanger ? 'bg-red-500' : 'bg-emerald-400'
                      } text-black`}
                    >
                      <Truck className="h-6 w-6" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 text-xs text-gray-400">
                Cusco · 3400m
              </div>
              <div className="absolute left-1/2 bottom-6 flex -translate-x-1/2 items-center gap-2 text-xs text-gray-400">
                Callao · Nivel del mar
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-300">
              {isOffline ? <WifiOff className="h-5 w-5 text-gray-400" /> : <Cloud className="h-5 w-5 text-white" />}
              <span>{guardianCopy}</span>
            </div>
          </div>

          {/* Valor: Pulso soberano */}
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-gray-400">
              <span>{guardianLabel}</span>
              <div className="flex items-center gap-2 text-white">
                <Cloud className={isOffline ? 'h-5 w-5 text-gray-600' : 'h-5 w-5 text-white'} />
                <Brain className={isOffline ? 'h-5 w-5 text-emerald-400' : 'h-5 w-5 text-white/70'} />
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <motion.div
                className="relative flex items-center justify-center"
                animate={{
                  scale: isDanger ? [1, 1.04, 1] : [1, 1.02, 1],
                  boxShadow: isDanger
                    ? '0 0 80px rgba(239,68,68,0.35)'
                    : '0 0 80px rgba(16,185,129,0.35)',
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    backgroundColor: isDanger ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.12)',
                    scale: isRecovering ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ duration: isRecovering ? 1.2 : 0.8, repeat: Infinity }}
                />

                <div
                  className="relative flex items-center justify-center rounded-full"
                  style={{ width: 320, height: 320 }}
                >
                  <div
                    className="absolute inset-6 rounded-full"
                    style={{ boxShadow: `0 0 0 12px ${statusColor}20, 0 0 0 32px ${statusColor}0d` }}
                  />
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `3px solid ${statusColor}` }}
                  />

                  <div className="relative flex flex-col items-center gap-2 text-center">
                    {isRecovering && (
                      <div className="flex items-center gap-2 text-emerald-300 text-sm">
                        <ShieldCheck className="h-5 w-5" /> IA corrigiendo
                      </div>
                    )}
                    <div className="text-sm uppercase tracking-[0.22em] text-gray-400">{displayLabel}</div>
                    <div className="flex items-baseline gap-2 text-7xl md:text-8xl font-semibold">
                      <motion.span
                        key={displayValue}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {displayValue}
                      </motion.span>
                      <span className="text-3xl text-gray-400">{displayUnit}</span>
                    </div>
                    <div className={`text-base ${isDanger ? 'text-red-300' : 'text-emerald-200'}`}>
                      {isDanger
                        ? 'ALERTA · Temperatura crítica'
                        : isOffline
                        ? 'MODO OFFLINE · Nodo Qori activo'
                        : 'Seguro en la nube · Cadena estable'}
                    </div>
                    {view === 'COMUNITARIA' && (
                      <div className={`text-sm ${compliance ? 'text-emerald-300' : 'text-red-300'}`}>
                        {compliance ? 'SAFE / COMPLIANT' : 'Excede límite comunitario'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusColor }}
                  aria-hidden
                />
                <span>{guardianCopy}</span>
              </div>
              <div className="flex items-center gap-4 text-xs uppercase tracking-[0.22em] text-gray-500">
                <button
                  type="button"
                  onClick={() => setView('OPERATIVA')}
                  className={`px-4 py-2 rounded-full ${
                    view === 'OPERATIVA' ? 'bg-white text-black' : 'bg-white/5 text-white'
                  }`}
                >
                  Corporativa
                </button>
                <button
                  type="button"
                  onClick={() => setView('COMUNITARIA')}
                  className={`px-4 py-2 rounded-full ${
                    view === 'COMUNITARIA' ? 'bg-white text-black' : 'bg-white/5 text-white'
                  }`}
                >
                  Comunitaria
                </button>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {isDanger && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ boxShadow: '0 0 120px rgba(239,68,68,0.18) inset' }}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ColdChainConsole;

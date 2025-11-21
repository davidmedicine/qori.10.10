'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudOff,
  RadioTower,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Droplet,
} from 'lucide-react';

const SCENARIO: 'LOGISTICS' | 'WATER' = 'LOGISTICS';

type ViewMode = 'CORPORATE' | 'COMMUNITY';
type SystemStatus = 'ONLINE' | 'OFFLINE';

type Telemetry = {
  flowRate: number; // m³/s
  pressure: number; // bar
  cpuTemp: number; // °C
  loRaSignal: number; // dBm
  npuLoad: number; // %
};

const BASE_TELEMETRY: Telemetry = {
  flowRate: 112,
  pressure: 5.6,
  cpuTemp: 55,
  loRaSignal: -88,
  npuLoad: 43,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const randomDelta = (maxDelta: number) => (Math.random() * 2 - 1) * maxDelta;

// Consola de demostración de ventas en una sola pantalla
export default function QoriDualModeConsole() {
  const [viewMode, setViewMode] = useState<ViewMode>('CORPORATE');
  const systemStatus: SystemStatus = 'OFFLINE';

  const [telemetry, setTelemetry] = useState<Telemetry>(BASE_TELEMETRY);
  const telemetryRef = useRef<Telemetry>(BASE_TELEMETRY);

  const [packetCounter, setPacketCounter] = useState<number>(9920);
  const packetCounterRef = useRef<number>(9920);

  const [logLines, setLogLines] = useState<string[]>([
    '> [12:00:00] QORI NODE v1.0 iniciado en modo aislado…',
    '> [12:00:01] Interfaces de nube deshabilitadas por política.',
    '> [12:00:02] Handshake de malla local con 3 nodos del corredor OK.',
  ]);

  const [isLedgerOverlay, setIsLedgerOverlay] = useState(false);

  // Simulación de telemetría: todo corre en el cliente, sin backend
  useEffect(() => {
    const interval = setInterval(() => {
      const prev = telemetryRef.current;

      const nextTelemetry: Telemetry = {
        flowRate: clamp(prev.flowRate + randomDelta(4), 85, 140),
        pressure: clamp(prev.pressure + randomDelta(0.15), 4.5, 7.5),
        cpuTemp: clamp(prev.cpuTemp + randomDelta(0.9), 45, 75),
        loRaSignal: clamp(prev.loRaSignal + randomDelta(2), -105, -70),
        npuLoad: clamp(prev.npuLoad + randomDelta(6), 10, 96),
      };

      telemetryRef.current = nextTelemetry;
      setTelemetry(nextTelemetry);

      // Incrementa el contador de paquetes
      const increment = Math.floor(Math.random() * 4) + 1;
      const nextPacket = packetCounterRef.current + increment;
      packetCounterRef.current = nextPacket;
      setPacketCounter(nextPacket);

      // Nueva línea de log usando el snapshot de telemetría
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');

      const line = `> [${hh}:${mm}:${ss}] Ingestando paquete LoRa #${nextPacket} · RSSI ${nextTelemetry.loRaSignal.toFixed(
        0,
      )} dBm · caudal=${nextTelemetry.flowRate.toFixed(1)} m³/s`;

      setLogLines(prevLines => {
        const updated = [line, ...prevLines];
        return updated.slice(0, 6);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleView = () => {
    if (viewMode === 'CORPORATE') {
      // Muestra overlay de derechos/registro antes de cambiar a vista comunidad
      setIsLedgerOverlay(true);
      setTimeout(() => {
        setViewMode('COMMUNITY');
        setIsLedgerOverlay(false);
      }, 1200);
    } else {
      // Vuelve a operación inmediatamente
      setViewMode('CORPORATE');
    }
  };

  const isCorporate = viewMode === 'CORPORATE';
  const isLogistics = SCENARIO === 'LOGISTICS';
  const corridorLabel = isLogistics
    ? 'CORREDOR LOGÍSTICO · ANDES SUR'
    : 'CORREDOR HIDRÁULICO · VALLE';

  // Nodos contextuales por industria
  const nodeGlyph = isLogistics ? Truck : Droplet;
  const nodes = isLogistics
    ? [
        { id: 'CUSCO', label: 'ORIGEN', x: 60, y: 170 },
        { id: 'CORREDOR SUR', label: 'SECCIÓN CRÍTICA', x: 220, y: 125 },
        { id: 'MATARANI', label: 'PUERTO', x: 400, y: 80 },
      ]
    : [
        { id: 'REPRESA', label: 'ORIGEN DE AGUA', x: 60, y: 170 },
        { id: 'PLANTA', label: 'TRATAMIENTO', x: 230, y: 115 },
        { id: 'VALLE', label: 'DISTRIBUCIÓN', x: 400, y: 85 },
      ];

  // Trayectorias del mapa: jagged para logística, suave para agua
  const mapPath = isLogistics
    ? 'M 28 186 L 110 148 C 140 132 160 138 178 156 L 212 188 C 238 210 282 170 310 150 L 346 122 C 366 110 392 102 432 96'
    : 'M 40 182 C 120 142 190 122 248 118 C 312 114 356 96 412 78 C 444 68 470 58 480 50';
  const ridgePath = isLogistics
    ? 'M 0 198 L 62 168 C 118 150 154 132 192 140 L 240 176 C 276 204 330 166 372 140 L 430 118 L 480 110'
    : 'M 0 190 C 80 150 120 140 190 120 C 250 100 330 80 410 70 C 450 65 480 50 480 50';

  // Métricas derivadas para storytelling
  const maxFlow = 140;
  const throughputScore = Math.round((telemetry.flowRate / maxFlow) * 100);

  const rightsLimit = 110; // p.ej. m³/s autorizados para comunidades a lo largo del corredor
  const overdraw = telemetry.flowRate - rightsLimit;
  const complianceScore = clamp(
    100 - Math.max(0, (overdraw / rightsLimit) * 100 * 0.6),
    0,
    100,
  );

  const cpuLoadEstimate = clamp(
    Math.round(((telemetry.cpuTemp - 45) / (75 - 45)) * 100),
    0,
    100,
  );
  const npuLoadPercent = Math.round(telemetry.npuLoad);
  const loRaQualityPercent = clamp(
    Math.round(((telemetry.loRaSignal + 105) / 35) * 100),
    0,
    100,
  );

  const velocityKph = clamp(Math.round(telemetry.flowRate * 0.7), 55, 96);
  const fuelBurn = clamp(18 + telemetry.npuLoad * 0.18, 18, 42);
  const etaMinutes = clamp(
    Math.round(170 - throughputScore + (100 - loRaQualityPercent) * 0.6),
    65,
    210,
  );
  const etaLabel = `~${(etaMinutes / 60).toFixed(1)} h`;
  const turbidity = clamp(telemetry.pressure * 2.4 + (75 - telemetry.cpuTemp) * 0.05, 0.8, 5.5);

  const OperationsIcon = isLogistics ? Truck : Droplet;
  const operationsTitle = isLogistics ? 'Cadena logística' : 'Flujo operativo';
  const operationsSubtitle = isLogistics
    ? 'Velocidad / Combustible / ETA'
    : 'Caudal / Presión / Calidad';
  const operationsMetrics = isLogistics
    ? [
        { label: 'Velocidad Promedio', value: `${velocityKph} km/h` },
        { label: 'Consumo Combustible', value: `${fuelBurn.toFixed(1)} L/100 km` },
        { label: 'ETA', value: etaLabel },
      ]
    : [
        { label: 'Caudal (L/s)', value: `${Math.round(telemetry.flowRate * 1000)} L/s` },
        { label: 'Presión (Bar)', value: `${telemetry.pressure.toFixed(2)} bar` },
        { label: 'Turbidez', value: `${turbidity.toFixed(1)} NTU` },
      ];

  return (
    <div className="relative min-h-screen bg-[#02040A] text-slate-100 font-mono overflow-hidden">
      {/* overlay de scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:100%_3px] opacity-20 mix-blend-soft-light" />

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[0.7rem] tracking-[0.22em] uppercase text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              QORI NODE v1.0
            </div>
            <span className="hidden text-xs text-slate-500 sm:inline">
              {corridorLabel}
            </span>
          </div>

          {/* Toggle de modo */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleToggleView}
              className="relative inline-flex items-center overflow-hidden rounded-full border border-white/15 bg-white/5 px-1 py-1 shadow-[0_0_0_1px_rgba(15,23,42,0.6)]"
            >
              <motion.div
                className="absolute inset-y-1 w-1/2 rounded-full bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
                initial={false}
                animate={{ x: isCorporate ? '0%' : '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              />
              <span
                className={`relative z-10 w-24 px-2 py-1 text-center text-[0.7rem] tracking-[0.14em] uppercase ${
                  isCorporate ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                Operación
              </span>
              <span
                className={`relative z-10 w-24 px-2 py-1 text-center text-[0.7rem] tracking-[0.14em] uppercase ${
                  !isCorporate ? 'text-orange-300' : 'text-slate-400'
                }`}
              >
                Comunidad
              </span>
            </button>
          </div>

          {/* Badges de estado */}
          <div className="flex items-center justify-end gap-3">
            {/* Estado nube */}
            <div className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[0.7rem] tracking-[0.15em] uppercase text-red-400">
              <CloudOff className="h-3 w-3" />
              <span>NUBE: DESCONECTADA</span>
            </div>
            {/* Estado malla */}
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[0.7rem] tracking-[0.15em] uppercase text-emerald-300">
              <RadioTower className="h-3 w-3" />
              <span>MALLA: ACTIVA</span>
            </div>
            {/* Contador de paquetes */}
            <div className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[0.7rem] tracking-[0.15em] uppercase text-cyan-200">
              <span>PKTS</span>
              <span className="font-semibold text-cyan-300">
                {packetCounter.toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        </header>

        {/* GRID PRINCIPAL */}
        <main className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-stretch">
          {/* CONSOLA / MAPA */}
          <section className="relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            {/* Marco del panel */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] tracking-[0.16em] uppercase text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                <span>
                  Telemetría de Corredor ·{' '}
                  {isCorporate ? operationsSubtitle : 'Cumplimiento / Derechos / Límites'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  ESTADO: <span className="text-red-400">{systemStatus}</span> · MODO AISLADO
                </span>
              </div>
            </div>

            <div className="relative flex-1 p-4 md:p-6">
              {/* Grid sutil / glow */}
              <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light">
                <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[length:40px_40px]" />
              </div>

              {/* Mapa SVG */}
              <div className="relative z-10">
                <svg
                  viewBox="0 0 480 220"
                  className="h-64 w-full md:h-80"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="corridorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop
                        offset="0%"
                        stopColor={isCorporate ? '#22D3EE' : '#FDBA74'}
                        stopOpacity="0.8"
                      />
                      <stop
                        offset="100%"
                        stopColor={isCorporate ? '#0EA5E9' : '#FB923C'}
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Silueta de valle / fondo */}
                  <path
                    d={ridgePath}
                    fill="none"
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth={1}
                    strokeDasharray="4 6"
                  />

                  {/* Trayectoria principal */}
                  <motion.path
                    d={mapPath}
                    fill="none"
                    stroke="url(#corridorGradient)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="16 24"
                    filter="url(#glow)"
                    initial={false}
                    animate={{
                      strokeDashoffset: isCorporate ? [0, -40] : [0, -20],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: 'loop',
                      duration: isCorporate ? 1.8 : 3.2,
                      ease: 'linear',
                    }}
                  />

                  {/* Pulsos de flujo */}
                  {[0, 1, 2].map(i => (
                    <motion.circle
                      key={i}
                      r={5}
                      cy={(isLogistics ? 158 : 150) - i * (isLogistics ? 18 : 20)}
                      initial={{ cx: isLogistics ? 30 : 40 }}
                      animate={{ cx: isLogistics ? 430 : 440 }}
                      transition={{
                        repeat: Infinity,
                        repeatType: 'loop',
                        duration: isCorporate ? 3 : 6,
                        delay: i * 0.6,
                        ease: 'linear',
                      }}
                      fill={isCorporate ? '#22D3EE' : '#FDBA74'}
                    />
                  ))}

                  {/* Nodos */}
                  {nodes.map(node => {
                    const NodeIcon = nodeGlyph;
                    const nodeColor = isCorporate ? '#22D3EE' : '#FDBA74';
                    return (
                      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle
                          r={14}
                          fill="rgba(15,23,42,0.85)"
                          stroke={nodeColor}
                          strokeWidth={2}
                        />
                        <circle
                          r={6}
                          className="animate-[pulse_2s_ease-in-out_infinite]"
                          fill={nodeColor}
                        />
                        <g transform="translate(-6, -6)">
                          <NodeIcon
                            className="pointer-events-none"
                            size={12}
                            strokeWidth={2}
                            color={nodeColor}
                          />
                        </g>
                        {!isCorporate && (
                          <g transform="translate(8, -14)">
                            <ShieldCheck
                              className="pointer-events-none"
                              size={12}
                              strokeWidth={2.4}
                              color="#FDBA74"
                            />
                          </g>
                        )}
                        <text
                          x={0}
                          y={-22}
                          textAnchor="middle"
                          className="fill-slate-300 text-[8px] tracking-[0.12em] uppercase"
                        >
                          {node.id}
                        </text>
                        <text
                          x={0}
                          y={24}
                          textAnchor="middle"
                          className="fill-slate-500 text-[7px]"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Métricas – esquina inferior izquierda */}
              <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-xs space-y-2 text-[0.7rem]">
                {isCorporate ? (
                  <div className="pointer-events-auto rounded-lg border border-cyan-400/40 bg-slate-950/80 px-3 py-2 shadow-[0_0_20px_rgba(34,211,238,0.45)]">
                    <div className="mb-2 flex items-center justify-between text-[0.65rem] tracking-[0.18em] uppercase text-cyan-300">
                      <span className="flex items-center gap-1">
                        <OperationsIcon className="h-3 w-3" />
                        {operationsTitle}
                      </span>
                      <span className="text-[0.6rem] text-cyan-200">{operationsSubtitle}</span>
                    </div>
                    <div className="space-y-1 text-[0.7rem] text-slate-100">
                      {operationsMetrics.map(metric => (
                        <div key={metric.label} className="flex items-center justify-between">
                          <span>{metric.label}</span>
                          <span className="text-cyan-300">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-auto rounded-lg border border-orange-400/50 bg-slate-950/85 px-3 py-2 shadow-[0_0_22px_rgba(251,146,60,0.55)]">
                    <div className="mb-1 flex items-center justify-between text-[0.65rem] tracking-[0.18em] uppercase text-orange-300">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Derechos y Cumplimiento
                      </span>
                    </div>
                    <div className="space-y-1 text-[0.7rem] text-slate-100">
                      <div className="flex items-center justify-between">
                        <span>Límite autorizado</span>
                        <span className="text-orange-300">{rightsLimit.toFixed(1)} m³/s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Uso actual</span>
                        <span className="text-orange-300">
                          {telemetry.flowRate.toFixed(1)} m³/s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Exceso</span>
                        <span className={overdraw > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {overdraw > 0 ? `+${overdraw.toFixed(1)} m³/s` : '0 m³/s'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Índice de cumplimiento</span>
                        <span
                          className={
                            complianceScore < 75 ? 'text-red-400' : 'text-emerald-400'
                          }
                        >
                          {complianceScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cinta modo aislado – esquina superior derecha */}
              <div className="pointer-events-none absolute right-4 top-4 z-20">
                <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/85 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-300">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span>MODO AISLADO · BYPASS NUBE 0</span>
                </div>
              </div>
            </div>
          </section>

          {/* PANEL DE SALUD DE DISPOSITIVO */}
          <aside className="relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="text-[0.7rem] tracking-[0.18em] uppercase text-slate-400">
                Salud del dispositivo · Nodo Qori · Solo local
              </div>
              <div className="flex items-center gap-1 text-[0.65rem] text-slate-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-[pulse_2s_ease-in-out_infinite]" />
                <span>Telemetría simulada</span>
              </div>
            </div>

            <div className="relative flex-1 p-4 space-y-4">
              {/* Carga CPU */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase text-slate-400">
                  <span>CARGA CPU</span>
                  <span className="text-slate-300">
                    {cpuLoadEstimate}% · {telemetry.cpuTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${cpuLoadEstimate}%` }}
                  />
                </div>
              </div>

              {/* Uso NPU */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase text-slate-400">
                  <span>USO NPU</span>
                  <span className="text-slate-300">{npuLoadPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${npuLoadPercent}%` }}
                  />
                </div>
              </div>

              {/* Calidad enlace LoRa */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase text-slate-400">
                  <span>CALIDAD ENLACE LoRa</span>
                  <span className="text-slate-300">
                    {telemetry.loRaSignal.toFixed(0)} dBm · {loRaQualityPercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                      loRaQualityPercent < 50
                        ? 'bg-red-500'
                        : loRaQualityPercent < 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${loRaQualityPercent}%` }}
                  />
                </div>
              </div>

              {/* Resumen de estado de enlaces */}
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-[0.7rem] text-slate-300">
                <div className="mb-1 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                  <span>Estado de enlaces</span>
                  <span>Registro inmutable: SOLO LOCAL</span>
                </div>
                <div className="flex flex-col gap-1 text-[0.7rem]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      Nube
                    </span>
                    <span className="text-red-400">Desconectada · 0 bytes exfiltrados</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <RadioTower className="h-3 w-3 text-emerald-400" />
                      Malla local
                    </span>
                    <span className="text-emerald-400">3 nodos del corredor en línea</span>
                  </div>
                </div>
              </div>

              {/* Log de eventos */}
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase text-slate-400">
                  <span>Registro de eventos</span>
                  <span className="text-slate-500">/var/qori/logs/mesh.log</span>
                </div>
                <div className="max-h-32 space-y-1 overflow-hidden text-[0.7rem] leading-snug">
                  <AnimatePresence initial={false}>
                    {logLines.map(line => (
                      <motion.div
                        key={line}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-300"
                      >
                        {line}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Overlay de registro / derechos al cambiar a vista Comunidad */}
      <AnimatePresence>
        {isLedgerOverlay && (
          <motion.div
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-orange-400/40 bg-slate-950/90 px-6 py-5 text-center shadow-[0_0_40px_rgba(251,146,60,0.7)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <ShieldCheck className="h-10 w-10 text-orange-300" />
              <div className="space-y-1">
                <p className="text-xs tracking-[0.2em] uppercase text-orange-300">
                  ACCESANDO REGISTRO INMUTABLE
                </p>
                <p className="text-sm text-slate-200">
                  VERIFICANDO DERECHOS DE AGUA · REGISTRANDO EVENTOS LOCALES · SIN DEPENDENCIA DE
                  NUBE.
                </p>
              </div>
              <p className="text-[0.7rem] text-slate-500">
                Todos los cálculos y firmas se generan en este Nodo Qori. Los datos se quedan en
                territorio.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

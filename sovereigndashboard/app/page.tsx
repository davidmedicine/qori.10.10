'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { motion } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  ChevronRight, 
  Database, 
  Layers, 
  ShieldAlert, 
  Zap 
} from 'lucide-react';

// --- COMPONENTS ---

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-12">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4"
    >
      {title}
    </motion.h2>
    {sub && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-slate-400 text-lg max-w-2xl border-l-2 border-teal-500 pl-4"
      >
        {sub}
      </motion.p>
    )}
  </div>
);

const SpecItem = ({ label, val }: { label: string; val: string }) => (
  <li className="flex items-center justify-between border-b border-white/10 py-3 font-mono text-sm">
    <span className="text-slate-500 uppercase tracking-wider">{label}</span>
    <span className="text-teal-400 font-bold">{val}</span>
  </li>
);

export default function LandingPage() {
  return (
    <main className="bg-slate-950 text-slate-200 selection:bg-teal-500/30 overflow-x-hidden">
      
      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col justify-center items-center">
        
        {/* Background: Pure Gradient (No Screenshot) */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]" />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(#ffffff05_1px,transparent_1px),linear-gradient(90deg,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-900/60 text-teal-300 text-xs font-bold tracking-[0.2em] uppercase mb-6 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Sistema de Prevención Activa
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6 max-w-5xl mx-auto leading-[0.9] drop-shadow-2xl"
          >
            Qori Mine Guard: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
              Bio-Seguridad
            </span>{' '}
            & Protección Geotécnica.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-slate-200 max-w-3xl mx-auto mb-10 font-light drop-shadow-lg"
          >
            Sistema de intervención autónoma Edge AI para operaciones críticas en Rajo Abierto.
            Protección integral para el operador y monitoreo geotécnico en zonas sin conectividad.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/contact" 
              className="group relative px-8 py-4 bg-teal-500 text-slate-950 font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.6)]"
            >
              Solicitar Piloto
              <ChevronRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/mining?client=default" 
              className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-white/10 transition-all backdrop-blur-md"
            >
              Ver Demo En Vivo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- 2. EXECUTIVE SUMMARY --- */}
      <section className="py-24 bg-slate-950 border-b border-white/5">
        <div className="container mx-auto px-6">
           <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <SectionHeader 
                  title="Tecnología 'Zero Harm'" 
                  sub="Para entornos de Alta Montaña." 
                />
                <p className="text-slate-400 leading-relaxed text-lg mb-6">
                  Qori Mine Guard es una Capa de Seguridad Crítica diseñada para cubrir los puntos ciegos de la telemetría tradicional. Mientras los sistemas estándar monitorean la eficiencia mecánica, nuestra solución unifica la <strong className="text-teal-400">Bio-Telemetría del Operador</strong> con el <strong className="text-teal-400">Análisis Geotécnico Local</strong> para prevenir fatalidades en tiempo real.
                </p>
                <p className="text-slate-400 leading-relaxed text-lg">
                  Operando de forma autónoma en "Zonas de Sombra" (sin cobertura 4G), el sistema procesa riesgos combinados —como fatiga crítica y desplazamiento de terreno— para ejecutar protocolos de intervención automática.
                </p>
              </div>
              <div className="bg-slate-900/50 p-8 rounded-lg border-l-4 border-teal-500 relative">
                 <Zap className="absolute top-6 right-6 text-teal-500/20 w-16 h-16" />
                 <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Propuesta de Valor</h3>
                 <p className="text-2xl font-light text-slate-200 italic">
                   "Del Reporte a la Intervención: Los sistemas GPS solo reportan accidentes. Qori Mine Guard los previene deteniendo el vehículo."
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* --- 3. THE HARDWARE (Exploded View) --- */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(#ffffff05_1px,transparent_1px),linear-gradient(90deg,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* LEFT: Exploded Image */}
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="order-2 lg:order-1 relative group w-full"
            >
              {/* Glow Effect */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-500/10 blur-[100px] rounded-full" />
              
              {/* Container for Next.js Image */}
              <div className="relative w-full h-[500px]">
                 <Image 
                    src="/qori-hardware-exploded.png" 
                    alt="Qori Node Exploded View Hardware" 
                    fill
                    className="object-contain drop-shadow-2xl"
                 />
              </div>
              <p className="mt-4 text-center text-xs font-mono text-slate-500">
                FIG 1.0: ARQUITECTURA INTERNA DE NODO QORI
              </p>
            </motion.div>

            {/* RIGHT: Specs */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <SectionHeader title="Ingeniería de Supervivencia" />
              <p className="text-slate-400 mb-8">
                Hardware soberano diseñado para resistir vibración, polvo y temperaturas extremas.
              </p>
              
              <ul className="space-y-2">
                <SpecItem label="Procesador" val="Raspberry Pi 5 (8GB) + Active Cooling" />
                <SpecItem label="Conectividad" val="Sixfab LTE + LoRa Mesh" />
                <SpecItem label="Posicionamiento" val="BerryGPS-IMUv4 (GNSS + Acc)" />
                <SpecItem label="Visión Artificial" val="Pi Camera Module 3 (Fatiga)" />
                <SpecItem label="Energía" val="UPS Rugerizado 20,000mAh" />
                <SpecItem label="Protocolo" val="J1939 / CAN Bus Integración" />
              </ul>

              <div className="mt-10 flex gap-4">
                 <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <ShieldAlert className="w-4 h-4 text-teal-500" />
                    ISO 45001 READY
                 </div>
                 <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <Database className="w-4 h-4 text-teal-500" />
                    LOCAL DATA STORAGE
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 4. THE CONTEXT (In-Cab Experience) --- */}
      <section className="relative w-full min-h-[800px] flex items-center justify-center overflow-hidden bg-black">
         
         {/* Background Image: In-Cab */}
         <div className="absolute inset-0 z-0">
            <Image 
              src="/qori-incab.png" 
              alt="Vista interior cabina minera" 
              fill
              className="object-cover" // Removed opacity to make it fully visible
            />
            {/* Gradient Overlay - Lighter now to just support text */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
         </div>
         
         <div className="relative z-10 container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between gap-12 mt-48">
                
                {/* Glass Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-xl w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-lg shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-red-400 uppercase tracking-widest">Alerta de Zona Muerta</span>
                  </div>
                  
                  <h3 className="text-3xl font-black text-white uppercase mb-4">Protección Offline</h3>
                  <p className="text-slate-200 mb-6 text-lg">
                    En la profundidad del rajo, la señal 4G desaparece. El hardware Qori (a la derecha) toma el control localmente, monitoreando fatiga y terreno sin latencia.
                  </p>

                  <div className="space-y-3 border-t border-white/10 pt-6">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Estado de Red</span>
                        <span className="text-red-400 font-mono font-bold">DESCONECTADO</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Latencia de Decisión</span>
                        <span className="text-teal-400 font-mono font-bold">&lt; 10ms (Edge)</span>
                     </div>
                  </div>
                </motion.div>

            </div>
         </div>
      </section>

      {/* --- 5. KEY MODULES --- */}
      <section className="py-32 bg-slate-950">
        <div className="container mx-auto px-6">
          <SectionHeader title="Módulos del Sistema" sub="Arquitectura modular para una seguridad integral." />
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-900 border border-white/5 p-8 rounded-sm hover:border-teal-500/50 transition-colors group"
            >
              <Activity className="w-10 h-10 text-teal-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white uppercase mb-3">Bio-Telemetría</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Monitoreo de SpO2 y Fatiga. Algoritmos predictivos que analizan variabilidad cardíaca y respuesta ocular para detectar somnolencia antes del incidente.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-900 border border-white/5 p-8 rounded-sm hover:border-teal-500/50 transition-colors group"
            >
              <Layers className="w-10 h-10 text-teal-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white uppercase mb-3">Radar Geotécnico</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Detección de desplazamiento de taludes. Uso de sensores IMU de grado industrial para identificar movimientos de tierra en rampas y bancos.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-900 border border-white/5 p-8 rounded-sm hover:border-teal-500/50 transition-colors group"
            >
              <Brain className="w-10 h-10 text-teal-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white uppercase mb-3">Guardian AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Intervención autónoma J1939. Inteligencia artificial 100% offline que toma el control del vehículo (frenado/desaceleración) en situaciones críticas.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-black border-t border-white/10 text-center">
         <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
               <h4 className="font-black text-white uppercase tracking-tighter text-xl">Qori Mine Guard</h4>
               <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">v2.4 Stable Release</p>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-xs text-slate-600 font-mono">Hub de Innovación Minera del Perú</span>
               <div className="h-4 w-[1px] bg-slate-800" />
               <span className="text-xs text-slate-600 font-mono">&copy; 2025 Qori Labs</span>
            </div>
         </div>
      </footer>

    </main>
  );
}
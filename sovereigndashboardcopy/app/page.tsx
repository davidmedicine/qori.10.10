import Link from "next/link";
import { Activity, RadioTower, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.1),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:100%_3px] opacity-15" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20">
        <header className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            Nodo Qori · Demo aislada
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Consola dual para ventas B2B: operación aislada, telemetría en vivo, Comunidad vs
              Operación en un solo switch.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              Esta instancia Next.js vive en modo 100% front-end. La consola simula ingestión
              LoRa/NPU, compliance de derechos de agua y evidencia el modo soberano sin nube para
              demos con clientes mineros y logísticos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-2">
              <Activity className="h-4 w-4 text-cyan-300" />
              Telemetría simulada en cliente
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Shift Comunidad con registro inmutable
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-2">
              <RadioTower className="h-4 w-4 text-orange-300" />
              Enlace malla local · sin nube
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/console"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-[0_15px_40px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
            >
              Abrir Consola Demo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:border-white/30"
            >
              Volver al sitio principal
            </Link>
          </div>
        </header>

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="text-sm uppercase tracking-[0.16em] text-slate-400">
              Qori Node · Ruta sugerida para demos
            </div>
            <div className="text-xs text-slate-400">
              100% cliente · Ajustado para portátiles de ventas · Español local
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-cyan-300">Paso 1</div>
              <p className="mt-1 text-sm text-slate-200">
                Abre la consola en <code className="font-mono text-cyan-300">/console</code> y usa
                el toggle para narrar Operación vs Comunidad.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-orange-300">
                Paso 2
              </div>
              <p className="mt-1 text-sm text-slate-200">
                Muestra el overlay de derechos y el log en vivo: todo corre en el cliente, sin
                backend ni nube.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-emerald-300">
                Paso 3
              </div>
              <p className="mt-1 text-sm text-slate-200">
                Sube/baja el caudal simulado y conecta la historia a acuerdos de cumplimiento y FPIC
                vivo con comunidades.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

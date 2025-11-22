import Link from "next/link";

export default function DemoIndex() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Demo Consolas</h1>
        <p className="text-sm text-gray-400">Explora la demo minera.</p>
        <Link
          href="/demo/mining"
          className="inline-block rounded border border-white/20 px-4 py-2 text-sm hover:border-white/60"
        >
          Ir a Mining Console
        </Link>
      </div>
    </main>
  );
}

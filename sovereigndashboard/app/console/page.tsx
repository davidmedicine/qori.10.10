import type { Metadata } from "next";
import ColdChainConsole from "../components/ColdChainConsole";

export const metadata: Metadata = {
  title: "Cadena de Frío · Nodo Qori",
  description:
    "Consola de demo para cadena de frío con fases de ruta andina, telemetría simulada e historias Operativa/Comunitaria.",
};

export default function ConsolePage() {
  return <ColdChainConsole />;
}

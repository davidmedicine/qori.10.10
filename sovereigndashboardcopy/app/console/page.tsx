import type { Metadata } from "next";
import QoriDualModeConsole from "../components/QoriDualModeConsole";

export const metadata: Metadata = {
  title: "Consola Dual Qori",
  description:
    "Demo de consola dual del Nodo Qori con telemetría simulada, operación aislada y modos Operación/Comunidad.",
};

export default function ConsolePage() {
  return <QoriDualModeConsole />;
}

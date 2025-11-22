import type { Metadata } from "next";
import MiningDashboard from "../../components/mining";

export const metadata: Metadata = {
  title: "Mining · Qori Guard",
  description: "Simulador de monitoreo soberano para operaciones mineras.",
};

export default function RansaMiningPage() {
  return <MiningDashboard />;
}

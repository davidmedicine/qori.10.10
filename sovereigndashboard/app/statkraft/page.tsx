import type { Metadata } from 'next';
import GLOFMonitorConsole from '../components/Glacial';

export const metadata: Metadata = {
  title: 'Statkraft · Monitor Glaciar',
  description:
    'Consola de monitoreo glacial (GLOF) con operación soberana, telemetría local y protocolos ANA.',
};

export default function StatkraftPage() {
  return <GLOFMonitorConsole />;
}

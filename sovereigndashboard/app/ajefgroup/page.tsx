import type { Metadata } from 'next';
import ColdChainConsole from '../components/ColdChainConsole';

export const metadata: Metadata = {
  title: 'Ransa · Cadena de Frío',
  description: 'Consola de monitoreo para transporte en ruta andina con fases normal/blind/incidente.',
};

export default function AjeGroupPage() {
  return <ColdChainConsole />;
}

import type { Metadata } from 'next';
import ColdChainConsole from '../new';

export const metadata: Metadata = {
  title: 'Nueva consola · Nodo Qori',
  description: 'Vista de cadena de frío de demostración (versión alternativa).',
};

export default function NewConsolePage() {
  return <ColdChainConsole />;
}

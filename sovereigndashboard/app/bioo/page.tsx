import type { Metadata } from 'next';
import BioConsole from '../components/bioconsole';

export const metadata: Metadata = {
  title: 'Bio Amayu · Guardian Network',
  description:
    'Nodo Guardián para Bio Amayu: patrulla fluvial, detección acústica offline y alertas a guardaparques.',
};

export default function BioOPage() {
  return <BioConsole />;
}

import type { Metadata } from 'next';
import BioConsole from '../components/bioconsole';

export const metadata: Metadata = {
  title: 'Bio Amayu · Guardian Network',
  description:
    'Consola Bio Amayu para detectar amenazas acústicas en la Amazonía y alertar a guardaparques, incluso sin 4G.',
};

export default function AjeGroupPage() {
  return <BioConsole />;
}

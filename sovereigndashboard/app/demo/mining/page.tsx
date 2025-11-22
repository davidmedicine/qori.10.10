import type { Metadata } from 'next';
import MineGuardPage from '../../components/mining';

export const metadata: Metadata = {
  title: 'Mining · Open Pit Monitor',
  description: 'Simulador de rajo abierto con monitoreo soberano para flotas mineras.',
};

export default function DemoMiningPage() {
  return <MineGuardPage />;
}

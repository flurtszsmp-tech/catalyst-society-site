import type { Metadata } from 'next';
import { CommunitiesSection } from '@/components/passport/sections/CommunitiesSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Komunitas' };

export default function PassportCommunitiesPage() {
  return <CommunitiesSection />;
}

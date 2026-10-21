import type { Metadata } from 'next';
import { AnalyticsSection } from '@/components/passport/sections/AnalyticsSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Analitik' };

export default function AnalyticsPage() {
  return <AnalyticsSection />;
}

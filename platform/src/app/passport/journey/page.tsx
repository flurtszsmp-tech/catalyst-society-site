import type { Metadata } from 'next';
import { JourneySection } from '@/components/passport/sections/JourneySection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Journey' };

export default function JourneyPage() {
  return <JourneySection />;
}

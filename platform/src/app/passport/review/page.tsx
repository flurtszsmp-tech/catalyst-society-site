import type { Metadata } from 'next';
import { ReviewSection } from '@/components/passport/sections/ReviewSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Verifikasi' };

export default function ReviewPage() {
  return <ReviewSection />;
}

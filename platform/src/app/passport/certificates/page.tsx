import type { Metadata } from 'next';
import { CertificatesSection } from '@/components/passport/sections/CertificatesSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Sertifikat' };

export default function CertificatesPage() {
  return <CertificatesSection />;
}

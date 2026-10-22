import type { Metadata } from 'next';

/* Judul awal sebelum isi profil termuat di browser; nama pemilik dipasang oleh halaman. */
export const metadata: Metadata = { title: { absolute: 'Profil · Catalyst Passport' } };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}

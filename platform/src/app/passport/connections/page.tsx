import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/passport/sections/common';
import { ConnectionsSection } from '@/components/passport/sections/ConnectionsSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Koneksi' };

export default function ConnectionsPage() {
  // useSearchParams (?q=) di dalam ConnectionsSection butuh batas Suspense
  // supaya halaman ini tetap bisa dirender statis saat build.
  return (
    <Suspense
      fallback={
        <div className="ps2">
          <Skeleton rows={3} height={96} label="Memuat koneksi…" />
        </div>
      }
    >
      <ConnectionsSection />
    </Suspense>
  );
}

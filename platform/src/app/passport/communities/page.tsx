import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/passport/sections/common';
import { CommunitiesSection } from '@/components/passport/sections/CommunitiesSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Komunitas' };

export default function PassportCommunitiesPage() {
  // useSearchParams (?gabung=) butuh batas Suspense supaya halaman tetap
  // bisa dirender statis saat build.
  return (
    <Suspense
      fallback={
        <div className="ps2">
          <Skeleton rows={3} height={96} label="Memuat komunitas…" />
        </div>
      }
    >
      <CommunitiesSection />
    </Suspense>
  );
}

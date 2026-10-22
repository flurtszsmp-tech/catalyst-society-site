'use client';

import { useEffect, useState } from 'react';
import { AboutCard, CommunitiesCard, JourneyPositionCard, ProjectsCard } from '@/components/passport/cards/ContentCards';
import { HeroCard } from '@/components/passport/cards/HeroCard';
import { CertificatesCard, PointsCard, ValueStrip } from '@/components/passport/cards/RailCards';
import { ToastProvider } from '@/components/ui/Toast';
import { getRepo } from '@/lib/repo';
import type { PassportBundle } from '@/lib/types';
import { PublicBadge, PublicCta, PublicHeader } from './PublicChrome';
import { PublicCv, ViewRecorder } from './PublicClient';
import '@/styles/ui.css';
import '@/styles/passport.css';

/**
 * Profil publik untuk ekspor statis. Alamat rapinya /pass/<slug>; karena GitHub
 * Pages tidak punya rute dinamis, 404.html meneruskannya ke /pass/?u=<slug>, lalu
 * halaman ini mengembalikan alamat rapi di bilah alamat. Isinya lewat repo yang
 * sama dengan dasbor: demo dari perangkat ini, atau Supabase dengan RLS.
 * Tautan ke situs utama memakai <a> biasa karena berada di luar aplikasi Next.
 */
export default function PublicProfile() {
  const [b, setB] = useState<PassportBundle | null | undefined>(undefined);

  useEffect(() => {
    const dariJalur = /^\/pass\/([^/?#]+)\/?$/.exec(window.location.pathname)?.[1];
    const slug = decodeURIComponent(dariJalur ?? new URLSearchParams(window.location.search).get('u') ?? '');
    if (!dariJalur && slug) history.replaceState(history.state, '', `/pass/${encodeURIComponent(slug)}`);
    getRepo().getPublicBundle(slug).then(setB, () => setB(null));
  }, []);

  useEffect(() => {
    if (b) document.title = `${b.profile.fullName} · Catalyst Passport`;
    else if (b === null) document.title = 'Profil tidak ditemukan · Catalyst Passport';
  }, [b]);

  const p = b?.profile;

  return (
    <div className="pass">
      <ToastProvider>
        {p && <ViewRecorder slug={p.slug} />}
        <div className="pass-public">
          <PublicHeader slug={p?.slug} name={p?.fullName} />
          {p && <PublicBadge catalystId={p.catalystId} />}

          {b === undefined && (
            <main className="pass-board" aria-busy="true" aria-label="Memuat profil">
              <div className="pass-col">
                <div className="ui-skeleton" style={{ height: 320, borderRadius: 16 }} />
                <div className="ui-skeleton" style={{ height: 150 }} />
              </div>
              <div className="pass-col">
                <div className="ui-skeleton" style={{ height: 200 }} />
              </div>
            </main>
          )}

          {b === null && (
            <div className="ui-empty pass-state" role="alert">
              <b>Profil tidak ditemukan</b>
              <p>Profil ini tidak ada atau disetel privat oleh pemiliknya.</p>
              <a className="ui-btn ui-btn-primary" href="/">
                Kembali ke Catalyst Society
              </a>
            </div>
          )}

          {b && p && (
            <main className="pass-board">
              <div className="pass-col">
                <HeroCard profile={p} communities={b.communities.length} badges={b.badges.length} />
                <AboutCard profile={p} />
                <ProjectsCard projects={b.projects} />
                <CommunitiesCard slugs={b.communities} />
                <JourneyPositionCard profile={p} journey={b.journey} />
              </div>
              <div className="pass-col">
                <PointsCard profile={p} events={[]} />
                <PublicCv profile={p} />
                <CertificatesCard certificates={b.certificates} />
              </div>
            </main>
          )}
        </div>
        {b && <PublicCta />}
        {b && <ValueStrip />}
      </ToastProvider>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AboutCard, CommunitiesCard, JourneyCard, ProjectsCard } from '@/components/passport/cards/ContentCards';
import { HeroCard } from '@/components/passport/cards/HeroCard';
import { BadgesCard, CertificatesCard, PointsCard, ValueStrip } from '@/components/passport/cards/RailCards';
import { BrandMark } from '@/components/ui/Icon';
import { ToastProvider } from '@/components/ui/Toast';
import { getRepo } from '@/lib/repo';
import type { PassportBundle } from '@/lib/types';
import { CvButton, ViewRecorder } from './PublicClient';
import '@/styles/ui.css';
import '@/styles/passport.css';

/**
 * Profil publik untuk ekspor statis (GitHub Pages tidak punya server untuk rute
 * /p/[slug]). Slug dibaca dari ?u= di browser, isinya lewat repo yang sama dengan
 * dasbor: demo dari perangkat ini, atau Supabase dengan RLS yang memutuskan.
 * Tautan ke luar /bp memakai <a> biasa supaya basePath tidak ikut ditempel.
 */
export default function PublicProfile() {
  const [b, setB] = useState<PassportBundle | null | undefined>(undefined);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('u') ?? '';
    getRepo().getPublicBundle(slug).then(setB, () => setB(null));
  }, []);

  useEffect(() => {
    if (b) document.title = `${b.profile.fullName} · Catalyst Passport`;
    else if (b === null) document.title = 'Profil tidak ditemukan · Catalyst Passport';
  }, [b]);

  const p = b?.profile;
  const cv = p && p.cvFileName && p.cvVisibility === 'public' ? p.cvFileName : null;

  return (
    <div className="pass">
      <ToastProvider>
        {p && <ViewRecorder slug={p.slug} />}
        <div className="pass-public">
          <header className="pass-public-top">
            <a href="/" className="pass-brand-pill" aria-label="Catalyst Society">
              <BrandMark />
              <span className="word" translate="no">
                <b>CATALYST</b>
                <span>PASSPORT</span>
              </span>
            </a>
            <div className="pass-public-act">
              <a href="/login.html?mode=daftar" className="ui-btn ui-btn-primary">
                Buat Passport Anda
              </a>
            </div>
          </header>

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
                <JourneyCard profile={p} journey={b.journey} />
                <CommunitiesCard slugs={b.communities} />
                <ProjectsCard projects={b.projects} />
              </div>
              <div className="pass-col">
                <PointsCard profile={p} events={[]} />
                <BadgesCard badges={b.badges} footer={cv ? <CvButton id={p.id} cvFileName={cv} /> : undefined} />
                <CertificatesCard certificates={b.certificates} />
              </div>
            </main>
          )}
        </div>
        {b && <ValueStrip />}
      </ToastProvider>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityPanel,
  CardPanel,
  ChecklistPanel,
  IdentityPanel,
  JourneyPanel,
  SharePanel,
  StatPanels,
  langkahBerikut,
} from '@/components/passport/home/HomePanels';
import { monthDelta } from '@/components/passport/cards/format';
import { publicUrl } from '@/components/passport/profile/links';
import { usePassport } from '@/components/passport/PassportProvider';
import { SITE_URL } from '@/lib/env';
import type { Certificate, EarnedBadge, JourneyEvent, PointEvent, Project } from '@/lib/types';

interface Data {
  journey: JourneyEvent[];
  badges: EarnedBadge[];
  communities: string[];
  projects: Project[];
  certificates: Certificate[];
  points: PointEvent[];
}

/** Jumlah bagian Passport yang dihitung di daftar "yang belum diisi". */
const BAGIAN = 6;

export default function PassportHome() {
  const { repo, profile, user } = usePassport();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState(SITE_URL);

  const muat = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [journey, badges, communities, projects, certificates, points] = await Promise.all([
        repo.listJourney(user.id),
        repo.listEarnedBadges(user.id),
        repo.listCommunities(user.id),
        repo.listProjects(user.id),
        repo.listCertificates(user.id),
        repo.listMyPointEvents(),
      ]);
      setData({ journey, badges, communities, projects, certificates, points });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat dasbor.');
    }
  }, [repo, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void muat();
  }, [muat, profile?.cataPoints]);

  useEffect(() => {
    // SITE_URL dipakai bila diisi supaya tautan berbagi selalu domain produksi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!SITE_URL) setOrigin(window.location.origin);
  }, []);

  /* Home memakai kanvas abu supaya panelnya terbaca melayang. Kelasnya
     ditaruh di <html> dan dicabut saat pindah halaman, jadi halaman lain
     tidak ikut berubah. */
  useEffect(() => {
    document.documentElement.classList.add('ph-kanvas');
    return () => document.documentElement.classList.remove('ph-kanvas');
  }, []);

  if (!profile) return null;

  if (error) {
    return (
      <div className="ui-empty pass-state" role="alert">
        <b>Dasbor tidak bisa dimuat</b>
        <p>{error}</p>
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => void muat()}>
          Coba lagi
        </button>
      </div>
    );
  }

  const shareUrl = publicUrl(profile.slug);

  if (!data) {
    return (
      <div className="ph-board" aria-busy="true" aria-label="Memuat dasbor">
        <div className="ph-kolom">
          <div className="ui-skeleton" style={{ height: 360, borderRadius: 16 }} />
          <div className="ui-skeleton" style={{ height: 220, borderRadius: 16 }} />
        </div>
        <div className="ph-kolom">
          <div className="ui-skeleton" style={{ height: 96, borderRadius: 16 }} />
          <div className="ui-skeleton" style={{ height: 210, borderRadius: 16 }} />
          <div className="ui-skeleton" style={{ height: 190, borderRadius: 16 }} />
        </div>
        <div className="ph-kolom">
          <div className="ui-skeleton" style={{ height: 160, borderRadius: 16 }} />
          <div className="ui-skeleton" style={{ height: 240, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const langkah = langkahBerikut(profile, data.projects, data.certificates, data.communities.length);

  return (
    <div className="ph-board">
      <div className="ph-kolom">
        <IdentityPanel profile={profile} shareUrl={shareUrl} />
        <ActivityPanel points={data.points} badges={data.badges} />
      </div>

      <div className="ph-kolom">
        <StatPanels
          profile={profile}
          communities={data.communities.length}
          badges={data.badges.length}
          monthPoints={monthDelta(data.points)}
          points={data.points}
        />
        <JourneyPanel profile={profile} />
        <ChecklistPanel langkah={langkah} total={BAGIAN} />
      </div>

      <div className="ph-kolom">
        <SharePanel url={shareUrl} />
        <CardPanel profile={profile} />
      </div>
    </div>
  );
}

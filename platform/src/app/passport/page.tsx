'use client';

import { useCallback, useEffect, useState } from 'react';
import { AboutCard, CommunitiesCard, JourneyCard, ProjectsCard } from '@/components/passport/cards/ContentCards';
import { HeroCard } from '@/components/passport/cards/HeroCard';
import { BadgesCard, CertificatesCard, PointsCard } from '@/components/passport/cards/RailCards';
import { ShareCard } from '@/components/passport/cards/ShareCard';
import { CvLink } from '@/components/passport/cards/CvLink';
import { useCelebration } from '@/components/passport/journey/Celebration';
import { usePassport } from '@/components/passport/PassportProvider';
import { publicUrl } from '@/components/passport/profile/links';
import type { Certificate, EarnedBadge, JourneyEvent, PointEvent, Project } from '@/lib/types';

interface Data {
  journey: JourneyEvent[];
  badges: EarnedBadge[];
  communities: string[];
  projects: Project[];
  certificates: Certificate[];
  points: PointEvent[];
}

export default function PassportHome() {
  const { repo, profile, user } = usePassport();
  const { openStage } = useCelebration();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="pass-board" aria-busy="true" aria-label="Memuat dasbor">
        <div className="pass-col">
          <div className="ui-skeleton" style={{ height: 320, borderRadius: 16 }} />
          <div className="ui-skeleton" style={{ height: 150 }} />
          <div className="ui-skeleton" style={{ height: 170 }} />
        </div>
        <div className="pass-col">
          <div className="ui-skeleton" style={{ height: 200 }} />
          <div className="ui-skeleton" style={{ height: 220 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="pass-board">
      <div className="pass-col">
        <HeroCard profile={profile} communities={data.communities.length} badges={data.badges.length} owner shareUrl={shareUrl} />
        <AboutCard profile={profile} owner />
        <JourneyCard profile={profile} journey={data.journey} owner onOpenStage={openStage} />
        <CommunitiesCard slugs={data.communities} owner />
        <ProjectsCard projects={data.projects} owner />
      </div>
      <div className="pass-col">
        <ShareCard url={shareUrl} name={profile.fullName} />
        <PointsCard profile={profile} events={data.points} owner />
        <BadgesCard badges={data.badges} owner footer={<CvLink profile={profile} owner />} />
        <CertificatesCard certificates={data.certificates} owner />
      </div>
    </div>
  );
}

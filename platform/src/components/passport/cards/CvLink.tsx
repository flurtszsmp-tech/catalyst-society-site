'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CvPreviewButton } from '@/components/passport/cv/CvViewer';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import type { Profile } from '@/lib/types';

/**
 * CV di bawah kartu Badges pada dasbor pemilik. Tanpa CV, tombolnya menjadi
 * ajakan menambahkan; dengan CV, membuka pratinjau tanpa mengunduh.
 */
export function CvLink({ profile }: { profile: Profile; owner?: boolean }) {
  const { repo } = usePassport();
  const [link, setLink] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let hidup = true;
    repo.getCvLink(profile.id).then((u) => hidup && setLink(u), () => hidup && setLink(null));
    return () => {
      hidup = false;
    };
  }, [repo, profile.id]);

  const load = useCallback(() => repo.getCvUrl(profile), [repo, profile]);

  if (link === undefined) return null;
  if (!link && !profile.cvFileName) {
    return (
      <Link className="cvb cvb-empty" href="/passport/profile#cv">
        <span className="cvb-ico" aria-hidden>
          <Icon name="plus" />
        </span>
        <span className="cvb-txt">
          <b>Tambahkan CV</b>
          <small>Unggah PDF atau tautkan Google Drive</small>
        </span>
      </Link>
    );
  }
  return (
    <CvPreviewButton
      name={profile.fullName}
      sub={link ? `${/drive\.google\.com|docs\.google\.com/.test(link) ? 'Google Drive' : 'Tautan CV'} · pratinjau` : `${profile.cvFileName} · pratinjau`}
      load={load}
      privat={profile.cvVisibility === 'private'}
    />
  );
}

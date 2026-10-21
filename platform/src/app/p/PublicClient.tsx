'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CvPreviewButton } from '@/components/passport/cv/CvViewer';
import { getRepo } from '@/lib/repo';
import type { Profile } from '@/lib/types';

/**
 * Mencatat satu kunjungan. Sengaja di browser, bukan saat render server,
 * supaya bot pratinjau tautan (LinkedIn, WhatsApp) tidak ikut terhitung.
 */
export function ViewRecorder({ slug }: { slug: string }) {
  const sudah = useRef(false);
  useEffect(() => {
    // StrictMode memasang efek dua kali di pengembangan; cukup sekali.
    if (sudah.current) return;
    sudah.current = true;
    void getRepo().recordProfileView(slug);
  }, [slug]);
  return null;
}

/**
 * CV di profil publik, di bawah kartu Badges. Tautan CV (misalnya Google
 * Drive) atau PDF yang diunggah dibuka sebagai pratinjau, tidak diunduh.
 * RLS yang memutuskan apakah pengunjung boleh membacanya; bila tidak,
 * tombolnya tidak tampil sama sekali.
 */
export function PublicCv({ profile }: { profile: Pick<Profile, 'id' | 'fullName' | 'cvFileName' | 'cvVisibility'> }) {
  const [link, setLink] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let hidup = true;
    getRepo()
      .getCvLink(profile.id)
      .then((u) => hidup && setLink(u), () => hidup && setLink(null));
    return () => {
      hidup = false;
    };
  }, [profile.id]);
  const load = useCallback(() => getRepo().getCvUrl(profile), [profile]);

  if (link === undefined) return null;
  const adaBerkas = !!profile.cvFileName && profile.cvVisibility === 'public';
  if (!link && !adaBerkas) return null;
  return (
    <CvPreviewButton
      name={profile.fullName}
      sub={link && /drive\.google\.com|docs\.google\.com/.test(link) ? 'Google Drive · pratinjau' : 'Pratinjau tanpa mengunduh'}
      load={load}
    />
  );
}

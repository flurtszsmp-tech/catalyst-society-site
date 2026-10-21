'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

/**
 * Tombol CV di bawah kartu Badges pada dasbor pemilik. Tanpa CV, tombolnya
 * menjadi ajakan mengunggah. Tautan bertanda tangan dibuat saat diklik
 * karena kedaluwarsa dalam 10 menit.
 */
export function CvLink({ profile }: { profile: Profile; owner?: boolean }) {
  const { repo } = usePassport();
  const toast = useToast();
  const [sibuk, setSibuk] = useState(false);

  if (!profile.cvFileName) {
    return (
      <Link className="ui-btn ui-btn-ghost pass-cv-btn" href="/passport/profile#cv">
        <Icon name="upload" />
        Unggah CV
      </Link>
    );
  }

  async function buka() {
    setSibuk(true);
    // Jendela dibuka sinkron supaya tidak diblokir penghalang pop-up.
    const w = window.open('', '_blank');
    if (w) w.opener = null;
    try {
      const url = await repo.getCvUrl(profile);
      if (!url) {
        w?.close();
        toast('CV tidak bisa dibuka.', 'error');
        return;
      }
      if (w) w.location.href = url;
      else window.location.href = url;
    } catch {
      w?.close();
      toast('Gagal membuka CV.', 'error');
    } finally {
      setSibuk(false);
    }
  }

  return (
    <button type="button" className="ui-btn ui-btn-ghost pass-cv-btn" onClick={() => void buka()} disabled={sibuk}>
      <Icon name="doc" />
      {sibuk ? 'Membuka…' : 'Lihat CV'}
      {profile.cvVisibility === 'private' && <small className="pass-cv-priv">privat</small>}
    </button>
  );
}

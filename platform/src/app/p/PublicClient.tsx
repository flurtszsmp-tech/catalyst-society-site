'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { getRepo } from '@/lib/repo';

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
 * Tombol CV di profil publik. Tautan bertanda tangan dibuat saat
 * diklik, bukan saat halaman dimuat, karena tautan itu kedaluwarsa
 * dalam 10 menit dan RLS storage yang memutuskan boleh tidaknya.
 */
export function CvButton({ id, cvFileName }: { id: string; cvFileName: string }) {
  const toast = useToast();
  const [sibuk, setSibuk] = useState(false);

  async function buka() {
    setSibuk(true);
    // Jendela dibuka dulu secara sinkron supaya tidak diblokir penghalang
    // pop-up. Bukan dengan fitur 'noopener': dengan itu window.open selalu
    // mengembalikan null dan tautan tidak bisa diarahkan. opener diputus
    // manual supaya halaman CV tidak bisa menyentuh halaman ini.
    const w = window.open('', '_blank');
    if (w) w.opener = null;
    try {
      const url = await getRepo().getCvUrl({ id, cvFileName });
      if (!url) {
        w?.close();
        toast('CV ini tidak tersedia.', 'error');
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
    <button type="button" className="ui-btn ui-btn-ghost pass-cv-btn" onClick={buka} disabled={sibuk}>
      <Icon name="doc" />
      {sibuk ? 'Membuka…' : 'Lihat CV'}
    </button>
  );
}

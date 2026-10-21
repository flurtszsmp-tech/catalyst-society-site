'use client';

import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/ui/Icon';

// Tirai pembuka hanya sekali per dokumen. Kembali ke beranda lewat
// navigasi klien tidak menutup layar lagi, karena tidak ada muat ulang
// yang perlu ditutupi.
let sudahTampil = false;

/**
 * Layar pembuka beranda. Selama tampil, body dikunci (.locked) supaya
 * halaman di belakangnya tidak ikut tergulir.
 *
 * Harus dirender SESUDAH <SiteNav>: efek SiteNav melepas .locked saat
 * pasang (menu tertutup), dan efek saudara berjalan berurutan.
 */
export function Loader() {
  const [fase, setFase] = useState<'aktif' | 'selesai' | 'hilang'>(() => (sudahTampil ? 'hilang' : 'aktif'));

  useEffect(() => {
    if (sudahTampil) return;
    const body = document.body;
    const ac = new AbortController();
    const timer: number[] = [];
    body.classList.add('locked');

    const selesai = () => {
      if (sudahTampil) return;
      sudahTampil = true;
      body.classList.remove('locked');
      setFase('selesai');
      timer.push(window.setTimeout(() => setFase('hilang'), 1200));
    };

    if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
      timer.push(window.setTimeout(selesai, 0));
    } else {
      const tunda = () => timer.push(window.setTimeout(selesai, 1350));
      if (document.readyState === 'complete') tunda();
      else addEventListener('load', tunda, { once: true, signal: ac.signal });
      // jaga jaga bila 'load' tidak pernah datang
      timer.push(window.setTimeout(selesai, 5000));
    }

    return () => {
      ac.abort();
      timer.forEach(clearTimeout);
      body.classList.remove('locked');
    };
  }, []);

  if (fase === 'hilang') return null;
  return (
    <div id="loader" className={fase === 'selesai' ? 'done' : undefined} aria-hidden>
      <BrandMark />
      <div className="lw">
        <span>Catalyst Society</span>
      </div>
      <div className="bar" />
    </div>
  );
}

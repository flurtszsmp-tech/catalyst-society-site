'use client';

import { useEffect, useState } from 'react';
import { Icon } from './Icon';

const KUNCI = 'catalyst-theme';

/**
 * Ganti tema terang/gelap. Kelas html.dark-theme dan kunci
 * localStorage sama dengan situs lama, dan skrip di <head> layout
 * memasangnya sebelum cat pertama supaya tidak berkedip putih.
 *
 * Tema baru menyebar dari titik tombol lewat View Transitions; browser
 * tanpa dukungan atau pengguna hemat gerak langsung berganti.
 *
 * Mengirim event 'tema-berubah' di document: halaman yang menghitung
 * sesuatu dari tema (misalnya kaca bilah navigasi di beranda) bisa
 * menghitung ulang tanpa menunggu gulir.
 */
export function ThemeToggle({ className = 'theme-toggle' }: { className?: string }) {
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGelap(document.documentElement.classList.contains('dark-theme'));
  }, []);

  function tukar() {
    const on = document.documentElement.classList.toggle('dark-theme');
    try {
      localStorage.setItem(KUNCI, on ? 'dark' : 'light');
    } catch {}
    setGelap(on);
    document.dispatchEvent(new CustomEvent('tema-berubah', { detail: on }));
  }

  function klik(e: React.MouseEvent<HTMLButtonElement>) {
    const hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
        updateCallbackDone: Promise<void>;
      };
    };
    if (hemat || !doc.startViewTransition) {
      tukar();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const jauh = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    const vt = doc.startViewTransition(tukar);
    // Ketiga promise menolak bila transisi dibatalkan; ditelan diam diam.
    vt.updateCallbackDone.catch(() => {});
    vt.finished.catch(() => {});
    vt.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${jauh}px at ${cx}px ${cy}px)`] },
          { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  }

  return (
    <button type="button" className={className} onClick={klik} aria-label="Ganti tema gelap/terang" aria-pressed={gelap}>
      <Icon name="moon" className="moon" />
      <Icon name="sun" className="sun" />
    </button>
  );
}

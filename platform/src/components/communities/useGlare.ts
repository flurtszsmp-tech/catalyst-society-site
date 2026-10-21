'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Kilau kaca mengikuti kursor, seperti kilau() di situs lama. Satu
 * pendengar di elemen akar, bukan satu per kartu, karena kartu berganti
 * setiap kali saringan atau bahasa berubah.
 */
export function useGlare(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const akar = ref.current;
    if (!akar) return;
    const gerak = (e: PointerEvent) => {
      const g = (e.target as Element | null)?.closest?.('.glass');
      if (!(g instanceof HTMLElement) || !akar.contains(g)) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      g.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    akar.addEventListener('pointermove', gerak, { passive: true });
    return () => akar.removeEventListener('pointermove', gerak);
  }, [ref]);
}

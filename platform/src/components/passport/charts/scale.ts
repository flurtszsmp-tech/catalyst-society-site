'use client';

/* ===========================================================
   Alat bantu grafik tulisan tangan: skala sumbu dan lebar wadah.
   Tanpa pustaka grafik supaya bundel Passport tetap ringan.
   =========================================================== */
import { useEffect, useRef, useState } from 'react';

/** Langkah sumbu 1, 2, atau 5 kali pangkat sepuluh, supaya angka garis bantu enak dibaca. */
function niceStep(raw: number): number {
  if (raw <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** Garis bantu bilangan bulat dari 0 sampai sedikit di atas nilai tertinggi. */
export function niceTicks(max: number, count = 4): number[] {
  const step = niceStep(Math.max(max, 1) / count);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const out: number[] = [];
  for (let v = 0; v <= top; v += step) out.push(v);
  return out;
}

/**
 * Lebar wadah dalam piksel. Grafik digambar sesuai lebar sebenarnya,
 * bukan diskalakan lewat viewBox, supaya teks sumbu tidak mengecil di layar ponsel.
 */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(240, Math.round(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

'use client';

import { useEffect, useRef, useState } from 'react';

/** Angka yang menghitung naik sekali, saat separuhnya masuk layar. */
export function Hitung({ end, prefix = '', className }: { end: number; prefix?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [nilai, setNilai] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dur = matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 1700;
    let id = 0;
    let t0 = 0;
    const langkah = (ts: number) => {
      if (!t0) t0 = ts;
      const p = dur ? Math.min((ts - t0) / dur, 1) : 1;
      setNilai((1 - Math.pow(1 - p, 3)) * end);
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    const io = new IntersectionObserver(
      (ents) => {
        if (!ents.some((e) => e.isIntersecting)) return;
        io.disconnect();
        id = requestAnimationFrame(langkah);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(id);
    };
  }, [end]);

  return (
    <div ref={ref} className={className}>
      {prefix + Math.round(nilai).toLocaleString('id-ID')}
    </div>
  );
}

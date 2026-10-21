'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n/provider';
import type { Lang } from '@/lib/i18n/dict';
import { Flag } from './Icon';

const NAMA: Record<Lang, string> = { id: 'Bahasa Indonesia', en: 'English', zh: '中文' };
const PENDEK: Record<Lang, string> = { id: 'Indonesia', en: 'English', zh: '中文' };

/** Pemilih bahasa berbentuk tombol pil dengan daftar kaca, seperti situs lama. */
export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    function luar(e: MouseEvent) {
      if (akar.current && !akar.current.contains(e.target as Node)) setBuka(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setBuka(false);
    }
    document.addEventListener('mousedown', luar);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', luar);
      document.removeEventListener('keydown', esc);
    };
  }, [buka]);

  return (
    <div className={`lang${buka ? ' buka' : ''}`} ref={akar}>
      <button
        type="button"
        className="lang-btn"
        aria-label="Ganti bahasa"
        aria-haspopup="listbox"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
      >
        <Flag lang={lang} className="bendera" />
        <span>{lang.toUpperCase()}</span>
        <svg className="panah" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="lang-list" role="listbox" aria-label="Bahasa">
        {(Object.keys(NAMA) as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            role="option"
            aria-selected={l === lang}
            className={l === lang ? 'on' : undefined}
            onClick={() => {
              setLang(l);
              setBuka(false);
            }}
          >
            <Flag lang={l} className="bendera" />
            {NAMA[l]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Versi baris tombol untuk menu burger di layar sempit. */
export function LangButtons() {
  const { lang, setLang } = useLang();
  return (
    <div className="menu-lang">
      {(Object.keys(PENDEK) as Lang[]).map((l) => (
        <button key={l} type="button" className={l === lang ? 'on' : undefined} onClick={() => setLang(l)}>
          <Flag lang={l} className="bendera" />
          {PENDEK[l]}
        </button>
      ))}
    </div>
  );
}

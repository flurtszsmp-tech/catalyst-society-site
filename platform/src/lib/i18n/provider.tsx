'use client';

/* ===========================================================
   Bahasa aktif untuk seluruh aplikasi.

   Server selalu merender bahasa Indonesia. Sesudah hidrasi, pilihan
   yang tersimpan di localStorage ('catalyst-lang', kunci yang sama
   dengan situs lama) atau bahasa browser diterapkan. Render pertama di
   browser sengaja sama dengan server supaya tidak ada ketidakcocokan
   hidrasi; pengunjung EN/ZH melihat kedipan singkat, sama seperti situs
   statis sebelumnya.
   =========================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DICT, LANGS, type Lang } from './dict';

const KUNCI = 'catalyst-lang';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Teks polos untuk kunci. Mengembalikan kunci itu sendiri bila tidak ada. */
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

function awal(): Lang {
  try {
    const s = localStorage.getItem(KUNCI) as Lang | null;
    if (s && LANGS.includes(s)) return s;
  } catch {}
  const n = (navigator.language || 'id').slice(0, 2).toLowerCase();
  return n === 'en' || n === 'zh' ? n : 'id';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    const l = awal();
    // Sengaja sesudah hidrasi: render pertama harus sama dengan server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l !== 'id') setLangState(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KUNCI, l);
    } catch {}
  }, []);

  const t = useCallback((key: string) => DICT[lang][key] ?? DICT.id[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang harus dipakai di dalam <LanguageProvider>.');
  return c;
}

/**
 * Teks kamus yang boleh berisi HTML sederhana (<br>, <strong>).
 * Aman karena isi kamus ditulis tim sendiri; JANGAN pernah memberi
 * komponen ini teks dari pengguna.
 */
export function T({ k, as: Tag = 'span', className }: { k: string; as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'b' | 'i'; className?: string }) {
  const { t } = useLang();
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: t(k) }} />;
}

/** Memilih varian {id,en,zh} sesuai bahasa aktif, dengan cadangan ke id lalu en. */
export function useLocalized() {
  const { lang } = useLang();
  return useCallback(
    (v: { id?: string; en?: string; zh?: string } | string | null | undefined): string => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      return v[lang] || v.id || v.en || '';
    },
    [lang],
  );
}

'use client';

import type { CSSProperties } from 'react';
import { useLang } from '@/lib/i18n/provider';

/**
 * Isi judul bagian, dipecah per <br> menjadi baris yang naik dari balik
 * garis potong (.baris > .bi). Situs lama memecahnya lewat innerHTML
 * setiap kali bahasa berganti; di sini pemecahan ikut render, jadi
 * selalu cocok dengan bahasa aktif.
 *
 * Isi baris berasal dari kamus yang ditulis tim sendiri (boleh berisi
 * <strong>), sama seperti <T>. Jangan beri komponen ini teks pengguna.
 */
export function Judul({ k }: { k: string }) {
  const { t } = useLang();
  return (
    <>
      {t(k)
        .split(/<br\s*\/?>/i)
        .map((isi, i) => (
          <span key={i} className="baris" style={{ '--b': i } as CSSProperties}>
            <span className="bi" dangerouslySetInnerHTML={{ __html: isi }} />
          </span>
        ))}
    </>
  );
}

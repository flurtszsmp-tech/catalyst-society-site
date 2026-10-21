'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { getRepo } from '@/lib/repo';
import { useCommunityCopy } from './copy';

type Keadaan =
  | { tahap: 'muat' }
  | { tahap: 'tamu' }
  | { tahap: 'siap'; tersimpan: boolean }
  | { tahap: 'kirim'; tersimpan: boolean };

/**
 * Tombol "Tambahkan ke Passport" di halaman detail komunitas.
 *
 * Tamu diarahkan ke /login.html dengan next= kembali ke halaman ini. Di mode
 * demo getSessionUser() selalu mengembalikan pengguna demo, jadi tombol
 * langsung bekerja terhadap localStorage.
 */
export function PassportAction({ slug }: { slug: string }) {
  const k = useCommunityCopy();
  const [st, setSt] = useState<Keadaan>({ tahap: 'muat' });
  const [pesan, setPesan] = useState<{ teks: string; err?: boolean } | null>(null);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const repo = getRepo();
        const user = await repo.getSessionUser();
        if (!hidup) return;
        if (!user) {
          setSt({ tahap: 'tamu' });
          return;
        }
        const milik = await repo.listCommunities(user.id);
        if (hidup) setSt({ tahap: 'siap', tersimpan: milik.includes(slug) });
      } catch {
        if (hidup) setSt({ tahap: 'tamu' });
      }
    })();
    return () => {
      hidup = false;
    };
  }, [slug]);

  async function ubah(tersimpan: boolean) {
    setSt({ tahap: 'kirim', tersimpan });
    setPesan(null);
    try {
      const repo = getRepo();
      if (tersimpan) await repo.leaveCommunity(slug);
      else await repo.joinCommunity(slug);
      setSt({ tahap: 'siap', tersimpan: !tersimpan });
      setPesan({ teks: tersimpan ? k.passportDihapus : k.passportDitambah });
    } catch (e) {
      setSt({ tahap: 'siap', tersimpan });
      setPesan({ teks: e instanceof Error ? e.message : 'Gagal menyimpan.', err: true });
    }
  }

  let tombol: React.ReactNode;
  if (st.tahap === 'tamu') {
    tombol = (
      <Link className="btn ghost com-pp" href={`/login.html?next=${encodeURIComponent(`/communities/${slug}`)}`}>
        <Icon name="plus" />
        {k.passportTambah}
      </Link>
    );
  } else {
    const tersimpan = st.tahap !== 'muat' && st.tersimpan;
    tombol = (
      <button
        type="button"
        className="btn ghost com-pp"
        disabled={st.tahap === 'muat' || st.tahap === 'kirim'}
        aria-pressed={st.tahap === 'muat' ? undefined : tersimpan}
        onClick={() => st.tahap === 'siap' && void ubah(st.tersimpan)}
      >
        <Icon name={tersimpan ? 'check' : 'plus'} />
        {tersimpan ? k.passportHapus : k.passportTambah}
      </button>
    );
  }

  return (
    <>
      {tombol}
      <p className={`com-pp-status${pesan?.err ? ' err' : ''}`} role="status" aria-live="polite">
        {st.tahap === 'tamu' ? k.passportMasuk : (pesan?.teks ?? '')}
      </p>
    </>
  );
}

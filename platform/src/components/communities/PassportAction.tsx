'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { getRepo } from '@/lib/repo';
import { useCommunityCopy } from './copy';

type Keadaan = { tahap: 'muat' } | { tahap: 'tamu' } | { tahap: 'siap'; tersimpan: boolean };

/**
 * Tombol "Tambahkan ke Passport" di halaman detail komunitas. Membawa ke
 * halaman Komunitas di Passport, yang menambahkan komunitas ini lewat
 * ?gabung=. Tamu diarahkan ke /login dengan next= ke halaman itu.
 */
export function PassportAction({ slug }: { slug: string }) {
  const k = useCommunityCopy();
  const [st, setSt] = useState<Keadaan>({ tahap: 'muat' });
  const tujuan = `/passport/communities?gabung=${encodeURIComponent(slug)}`;

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

  if (st.tahap === 'tamu') {
    return (
      <>
        <a className="btn ghost com-pp" href={`/login?next=${encodeURIComponent(tujuan)}`}>
          <Icon name="plus" />
          {k.passportTambah}
        </a>
        <p className="com-pp-status" role="status" aria-live="polite">
          {k.passportMasuk}
        </p>
      </>
    );
  }

  const tersimpan = st.tahap === 'siap' && st.tersimpan;
  return (
    <>
      <Link className="btn ghost com-pp" href={tersimpan ? '/passport/communities' : tujuan} aria-disabled={st.tahap === 'muat' || undefined}>
        <Icon name={tersimpan ? 'check' : 'plus'} />
        {tersimpan ? 'Ada di Passport Anda' : k.passportTambah}
      </Link>
      <p className="com-pp-status" role="status" aria-live="polite" />
    </>
  );
}

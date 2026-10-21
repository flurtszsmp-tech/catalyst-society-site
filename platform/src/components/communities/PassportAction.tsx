'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { getRepo } from '@/lib/repo';
import type { MembershipStatus } from '@/lib/types';
import { useCommunityCopy } from './copy';

type Keadaan = { tahap: 'muat' } | { tahap: 'tamu' } | { tahap: 'siap'; status: MembershipStatus | null };

const LABEL: Record<MembershipStatus, string> = {
  pending: 'Menunggu verifikasi tim',
  verified: 'Terverifikasi di Passport Anda',
  rejected: 'Pengajuan ditolak, perbaiki buktinya di Passport',
};

/**
 * Tombol "Tambahkan ke Passport" di halaman detail komunitas.
 *
 * Bergabung kini berarti mengajukan dengan bukti keanggotaan, jadi tombol
 * ini membawa ke halaman Komunitas di Passport yang membuka formulirnya.
 * Tamu diarahkan ke /login.html dengan next= ke halaman itu.
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
        const milik = await repo.listMyMemberships();
        if (hidup) setSt({ tahap: 'siap', status: milik.find((m) => m.slug === slug)?.status ?? null });
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
        <a className="btn ghost com-pp" href={`/login.html?next=${encodeURIComponent(`/bp${tujuan}`)}`}>
          <Icon name="plus" />
          {k.passportTambah}
        </a>
        <p className="com-pp-status" role="status" aria-live="polite">
          {k.passportMasuk}
        </p>
      </>
    );
  }

  const status = st.tahap === 'siap' ? st.status : null;
  return (
    <>
      <Link className="btn ghost com-pp" href={status ? '/passport/communities' : tujuan} aria-disabled={st.tahap === 'muat' || undefined}>
        <Icon name={status === 'verified' ? 'check' : status ? 'clock' : 'plus'} />
        {status ? 'Lihat di Passport' : k.passportTambah}
      </Link>
      <p className="com-pp-status" role="status" aria-live="polite">
        {status ? LABEL[status] : ''}
      </p>
    </>
  );
}

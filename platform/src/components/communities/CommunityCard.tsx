'use client';

import Link from 'next/link';
import type { Community } from '@/lib/data/communities';
import { useLocalized } from '@/lib/i18n/provider';
import { Icon } from '@/components/ui/Icon';
import { useCommunityCopy } from './copy';
import { CommunityLogo } from './CommunityLogo';
import { memberCount } from './shared';

export function CommunityCard({ community: c }: { community: Community }) {
  const k = useCommunityCopy();
  const pilih = useLocalized();
  const n = memberCount(c.members);

  return (
    <Link className="com-card glass" href={`/communities/${encodeURIComponent(c.slug)}`}>
      <span className="com-card-top">
        <CommunityLogo community={c} />
        <Icon name="out" className="com-out" />
      </span>
      <span className="com-title">
        {c.name}
        <Icon name="spark4" className="com-verified" />
        <span className="sr-only">, {k.mitra}</span>
      </span>
      {/* Aturan 3: deskripsi kosong tidak berisi apa pun, tetapi ruangnya
          tetap ada supaya garis meta di semua kartu sejajar. */}
      <span className="com-desc">{pilih(c.short)}</span>
      <span className="com-meta">
        {c.category && <span className="com-tag">{c.category}</span>}
        <span className="com-join-type">{n ? `${n} ${k.anggota}` : k.komunitas}</span>
      </span>
    </Link>
  );
}

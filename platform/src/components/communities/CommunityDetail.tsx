'use client';

import { useRef } from 'react';
import { CHANNELS, visibleCommunities, type Community } from '@/lib/data/communities';
import { useLocalized } from '@/lib/i18n/provider';
import { safeHref } from '@/lib/url';
import { Icon } from '@/components/ui/Icon';
import { CommunityCard } from './CommunityCard';
import { CommunityLogo } from './CommunityLogo';
import { useCommunityCopy } from './copy';
import { PassportAction } from './PassportAction';
import { memberCount, platformLinks } from './shared';
import { useGlare } from './useGlare';

export function CommunityDetail({ community: c }: { community: Community }) {
  const k = useCommunityCopy();
  const pilih = useLocalized();
  const akar = useRef<HTMLDivElement>(null);
  useGlare(akar);

  const kanal = CHANNELS.find((x) => x.key === c.channel);
  const n = memberCount(c.members);
  const penuh = pilih(c.full);
  const platform = platformLinks(c);
  // Aturan 7: tanpa Join URL, tombolnya mati, bukan mengarah ke mana-mana.
  const joinUrl = safeHref(c.join.url);
  const terkait = visibleCommunities()
    .filter((o) => o.channel === c.channel && o.slug !== c.slug)
    .slice(0, 3);

  return (
    <div className="wrap" ref={akar}>
      <a className="com-back" href="/#community">
        <Icon name="back" />
        {k.kembali}
      </a>

      <div className="com-detail">
        <div>
          <div className="com-id">
            <CommunityLogo community={c} size={74} />
            <div>
              <h1>
                {c.name}
                <Icon name="spark4" className="com-verified" />
                <span className="sr-only">, {k.mitra}</span>
              </h1>
              <div className="com-sub">
                {kanal && <span>{pilih(kanal.label)}</span>}
                {c.category && (
                  <>
                    <span className="dot" aria-hidden />
                    <span>{c.category}</span>
                  </>
                )}
                <span className="dot" aria-hidden />
                <span>{n ? `${n} ${k.anggota}` : k.komunitas}</span>
              </div>
            </div>
          </div>

          {penuh && <p className="com-body">{penuh}</p>}

          {/* Aturan 8: tanpa topik, bagiannya tidak dirender. */}
          {c.tags.length > 0 && (
            <div className="com-tags">
              {c.tags.map((t) => (
                <span key={t} className="com-tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          {c.membership.length > 0 && (
            <div className="com-memberships">
              {c.membership.map((m) => (
                <span key={m} className="com-member">
                  {k.keanggotaan[m]}
                </span>
              ))}
            </div>
          )}
        </div>

        <aside className="com-aside glass">
          <div className="com-actions">
            {joinUrl ? (
              <a className="btn" href={joinUrl} target="_blank" rel="noopener noreferrer">
                {k.gabung}
                <Icon name="out" className="com-out" />
                <span className="sr-only"> {k.tabBaru}</span>
              </a>
            ) : (
              <button type="button" className="btn btn-soon" disabled>
                {k.gabung} <i>{k.gabungSoon}</i>
              </button>
            )}
            <PassportAction slug={c.slug} />
          </div>
          <p className="com-note">{joinUrl ? k.catatan : k.catatanKosong}</p>

          {platform.length > 0 && (
            <div className="com-platforms">
              <div className="kicker">{k.platform}</div>
              {platform.map((p) => (
                <a key={p.key} className="com-plat" href={p.href} target="_blank" rel="noopener noreferrer">
                  <Icon name={p.icon} className="ico" />
                  <span>{p.label}</span>
                  <Icon name="out" className="out" />
                  <span className="sr-only"> {k.tabBaru}</span>
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>

      {terkait.length > 0 && (
        <section className="com-related" aria-labelledby="com-related-h">
          <h2 id="com-related-h">{k.terkait}</h2>
          <div className="com-grid">
            {terkait.map((o) => (
              <CommunityCard key={o.slug} community={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

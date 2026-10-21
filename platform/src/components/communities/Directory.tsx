'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CHANNELS, visibleCommunities } from '@/lib/data/communities';
import { T, useLocalized } from '@/lib/i18n/provider';
import { Icon } from '@/components/ui/Icon';
import { CommunityCard } from './CommunityCard';
import { useCommunityCopy } from './copy';
import { parseChannel, type ChannelFilter } from './shared';
import { useGlare } from './useGlare';

/**
 * Direktori /communities: kepala halaman, rail kanal, kotak cari, dan
 * petak kartu.
 *
 * Tombol rail dirender dari daftar tetap dengan key stabil, jadi saat
 * kanal berganti React hanya mengubah kelas dan aria-pressed; elemen
 * tombolnya tidak diganti dan fokus papan ketik tetap di tempatnya.
 */
export function Directory({ initialChannel }: { initialChannel: ChannelFilter }) {
  const k = useCommunityCopy();
  const pilih = useLocalized();
  const [kanal, setKanal] = useState<ChannelFilter>(initialChannel);
  const [cari, setCari] = useState('');
  // ekspor statis: ?ch= dari tautan dibaca setelah halaman terbuka
  useEffect(() => {
    const awal = parseChannel(new URLSearchParams(window.location.search).get('ch'));
    if (awal !== 'all') setKanal(awal);
  }, []);
  const akar = useRef<HTMLDivElement>(null);
  useGlare(akar);

  const semua = useMemo(() => visibleCommunities(), []);
  const q = cari.trim().toLowerCase();
  const daftar = semua.filter((c) => {
    if (kanal !== 'all' && c.channel !== kanal) return false;
    if (!q) return true;
    return [c.name, c.category, pilih(c.short), c.tags.join(' ')].join(' ').toLowerCase().includes(q);
  });

  function gantiKanal(v: ChannelFilter) {
    setKanal(v);
    // Saringan ikut ke alamat supaya tautannya bisa dibagikan. replaceState
    // dikenali App Router tanpa memuat ulang halaman.
    const u = new URL(window.location.href);
    if (v === 'all') u.searchParams.delete('ch');
    else u.searchParams.set('ch', v);
    window.history.replaceState(null, '', `${u.pathname}${u.search}`);
  }

  function reset() {
    setCari('');
    gantiKanal('all');
  }

  const rail: { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: k.semua },
    ...CHANNELS.map((c) => ({ key: c.key, label: pilih(c.label) })),
  ];

  return (
    <div className="wrap" ref={akar}>
      <div className="shead com-head">
        <div>
          <div className="kicker">
            <T k="com.kicker" />
          </div>
          <T k="com.judul" as="h1" className="h-lg" />
          <T k="com.sub" as="p" className="lead" />
        </div>
        <div className="com-count" aria-live="polite">
          {k.hitung(daftar.length)}
        </div>
      </div>

      <div className="com-tools">
        <div className="com-filter" role="group" aria-label={k.saring}>
          {rail.map((r) => (
            <button
              key={r.key}
              type="button"
              className={kanal === r.key ? 'on' : undefined}
              aria-pressed={kanal === r.key}
              onClick={() => gantiKanal(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="com-search">
          <Icon name="search" />
          <input
            type="search"
            autoComplete="off"
            value={cari}
            placeholder={k.cari}
            aria-label={k.cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </label>
      </div>

      <div className="com-grid">
        {daftar.length ? (
          daftar.map((c) => <CommunityCard key={c.slug} community={c} />)
        ) : (
          <div className="com-empty">
            <p>{k.kosong}</p>
            <button type="button" className="btn ghost" onClick={reset}>
              {k.reset}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

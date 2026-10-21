'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS, COMMUNITIES, visibleCommunities, type ChannelKey, type Community } from '@/lib/data/communities';
import { initials } from '@/lib/url';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHead,
  SessionGate,
  Skeleton,
  errMsg,
  useFocusAfterRender,
  useLoad,
} from './common';

/** Tonggak hadiah, sama dengan trigger komunitas di 0001_init.sql. */
const REWARDS = [
  { n: 1, title: 'Komunitas pertama', detail: '+20 poin CATA dan lencana First Community' },
  { n: 3, title: 'Tahap Connector', detail: '+30 poin CATA dan tahap Connector di Journey' },
  { n: 5, title: 'Community Explorer', detail: '+20 poin CATA dan lencana Community Explorer' },
];

const CHANNEL_LABEL = new Map(CHANNELS.map((c) => [c.key, c.label.id]));

/**
 * Logo komunitas berasal dari data tim di repo, berupa path lokal di
 * public/. Hanya path satu garis miring yang diterima; "//host" akan
 * dibaca browser sebagai domain lain.
 */
function localAsset(p: string | null): string | null {
  return p && p.startsWith('/') && !p.startsWith('//') ? p : null;
}

function Logo({ c, name }: { c: Community | null; name: string }) {
  const src = localAsset(c?.logo ?? null);
  if (!src) {
    return (
      <span className="ps2-comm-logo ps2-comm-ini" aria-hidden>
        {initials(name)}
      </span>
    );
  }
  return <Image className="ps2-comm-logo" src={src} alt="" width={40} height={40} />;
}

export function CommunitiesSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const uid = user?.id ?? null;
  const load = useMemo(() => (uid ? () => repo.listCommunities(uid) : null), [repo, uid]);
  const mine = useLoad(load);
  const focusLater = useFocusAfterRender();

  const [channel, setChannel] = useState<ChannelKey | 'all'>('all');
  const [pending, setPending] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<{ slug: string; name: string } | null>(null);

  const joined = useMemo(() => new Set(mine.data ?? []), [mine.data]);
  const count = mine.data?.length ?? 0;
  const discover = useMemo(
    () => visibleCommunities().filter((c) => !joined.has(c.slug) && (channel === 'all' || c.channel === channel)),
    [joined, channel],
  );

  const join = async (c: Community) => {
    setPending(c.slug);
    try {
      await repo.joinCommunity(c.slug);
      mine.update((list) => (list.includes(c.slug) ? list : [...list, c.slug]));
      toast(`Bergabung ke ${c.name}.`);
      focusLater('ps2-mine-title');
      // Poin dan tahap dihitung trigger di database; profil dimuat ulang supaya ikut segar.
      void reload();
    } catch (e) {
      toast(errMsg(e, 'Gagal bergabung ke komunitas.'), 'error');
    } finally {
      setPending(null);
    }
  };

  const leave = async () => {
    if (!leaving) return;
    const { slug, name } = leaving;
    setPending(slug);
    try {
      await repo.leaveCommunity(slug);
      mine.update((list) => list.filter((s) => s !== slug));
      toast(`Anda keluar dari ${name}.`);
      setLeaving(null);
      focusLater('ps2-mine-title');
      void reload();
    } catch (e) {
      toast(errMsg(e, 'Gagal keluar dari komunitas.'), 'error');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="ps2">
      <PageHead
        title="Komunitas"
        lead="Komunitas mitra yang Anda ikuti tampil di Passport publik Anda. Tambahkan yang relevan dengan minat Anda."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="ps2-grid-2">
          <Card
            id="ps2-mine-title"
            title="Komunitas saya"
            aside={mine.data ? <span className="ps2-pill">{count} komunitas</span> : undefined}
          >
            {mine.error ? (
              <ErrorState message={mine.error} onRetry={mine.retry} />
            ) : !mine.data ? (
              <Skeleton rows={3} height={64} label="Memuat komunitas Anda…" />
            ) : mine.data.length === 0 ? (
              <EmptyState icon="users" title="Belum ada komunitas">
                Pilih komunitas di bagian Temukan komunitas. Komunitas pertama langsung memberi 20 poin CATA.
              </EmptyState>
            ) : (
              <ul className="ps2-comms">
                {mine.data.map((slug) => {
                  const c = COMMUNITIES.find((x) => x.slug === slug) ?? null;
                  const name = c?.name ?? slug;
                  const visible = c && c.status !== 'hidden';
                  return (
                    <li key={slug} className="ps2-comm">
                      <Logo c={c} name={name} />
                      <div className="ps2-comm-txt">
                        {visible ? <Link href={`/communities/${encodeURIComponent(slug)}`}>{name}</Link> : <b>{name}</b>}
                        <small>{c?.category ?? 'Komunitas tidak lagi ditampilkan'}</small>
                      </div>
                      <button
                        type="button"
                        className="ui-btn ui-btn-ghost ps2-btn-sm"
                        onClick={() => setLeaving({ slug, name })}
                        disabled={pending === slug}
                        aria-label={`Keluar dari ${name}`}
                      >
                        Keluar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card id="ps2-rewards-title" title="Hadiah bergabung">
            <ol className="ps2-rewards">
              {REWARDS.map((r) => {
                const done = !!mine.data && count >= r.n;
                return (
                  <li key={r.n} className={`ps2-reward${done ? ' is-done' : ''}`}>
                    <span className="ps2-reward-n" aria-hidden>
                      {done ? <Icon name="check" size={14} /> : r.n}
                    </span>
                    <span>
                      {r.n} komunitas: {r.title}
                      {done && <span className="sr-only"> (sudah tercapai)</span>}
                      <small>{r.detail}</small>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="ps2-sub" style={{ marginTop: 12 }}>
              Setiap hadiah diberikan sekali. Keluar dari komunitas tidak mengurangi poin atau lencana yang sudah didapat.
            </p>
          </Card>
        </div>

        <Card id="ps2-discover-title" title="Temukan komunitas">
          <div className="ps2-filters" role="group" aria-label="Saring menurut channel">
            <button
              type="button"
              className="ps2-chip"
              aria-pressed={channel === 'all'}
              onClick={() => setChannel('all')}
            >
              Semua
            </button>
            {CHANNELS.map((ch) => (
              <button
                key={ch.key}
                type="button"
                className="ps2-chip"
                aria-pressed={channel === ch.key}
                onClick={() => setChannel(ch.key)}
              >
                {ch.label.id}
              </button>
            ))}
          </div>
          {mine.error ? (
            <p className="ps2-sub">Daftar komunitas tampil setelah komunitas Anda berhasil dimuat.</p>
          ) : !mine.data ? (
            <Skeleton rows={3} height={64} label="Memuat komunitas…" />
          ) : discover.length === 0 ? (
            <EmptyState icon="search" title="Tidak ada komunitas lain">
              {channel === 'all'
                ? 'Anda sudah bergabung ke semua komunitas mitra. Luar biasa.'
                : `Tidak ada komunitas ${CHANNEL_LABEL.get(channel) ?? ''} yang belum Anda ikuti.`}
            </EmptyState>
          ) : (
            <ul className="ps2-comms">
              {discover.map((c) => (
                <li key={c.slug} className="ps2-comm">
                  <Logo c={c} name={c.name} />
                  <div className="ps2-comm-txt">
                    <Link href={`/communities/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
                    <small>
                      {CHANNEL_LABEL.get(c.channel)} · {c.category}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary ps2-btn-sm"
                    onClick={() => void join(c)}
                    disabled={pending !== null}
                    aria-busy={pending === c.slug || undefined}
                    aria-label={`Tambahkan ${c.name}`}
                  >
                    {pending === c.slug ? 'Menambahkan…' : 'Tambahkan'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ConfirmDialog
          open={!!leaving}
          title="Keluar dari komunitas?"
          message={
            <p>
              {leaving?.name} akan dihapus dari Passport Anda. Poin dan lencana yang sudah didapat tetap tersimpan.
            </p>
          }
          confirmLabel="Keluar"
          danger
          busy={!!leaving && pending === leaving.slug}
          onConfirm={() => void leave()}
          onCancel={() => setLeaving(null)}
        />
      </SessionGate>
    </div>
  );
}

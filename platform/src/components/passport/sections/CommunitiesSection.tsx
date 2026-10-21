'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS, COMMUNITIES, visibleCommunities, type ChannelKey, type Community } from '@/lib/data/communities';
import { initials, safeHref } from '@/lib/url';
import { Card, EmptyState, ErrorState, PageHead, SessionGate, Skeleton, errMsg, useFocusAfterRender, useLoad } from './common';

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

/** Tautan grup komunitas (WhatsApp, Discord, Telegram, dan sebagainya), bila ada. */
function joinUrl(c: Community | null): string | null {
  return safeHref(c?.join.url ?? null);
}

export function CommunitiesSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const params = useSearchParams();
  const uid = user?.id ?? null;
  const load = useMemo(() => (uid ? () => repo.listCommunities(uid) : null), [repo, uid]);
  const mine = useLoad(load);
  const focusLater = useFocusAfterRender();

  const [channel, setChannel] = useState<ChannelKey | 'all'>('all');
  const [pending, setPending] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<{ slug: string; name: string } | null>(null);

  const joined = useMemo(() => new Set(mine.data ?? []), [mine.data]);
  const discover = useMemo(
    () => visibleCommunities().filter((c) => !joined.has(c.slug) && (channel === 'all' || c.channel === channel)),
    [joined, channel],
  );

  /**
   * Menambahkan komunitas ke Passport lalu membuka grupnya. Tab baru dibuka
   * sinkron di dalam klik, sebelum menunggu server, supaya tidak diblokir
   * penghalang pop-up; opener diputus supaya grup tidak bisa menyentuh halaman ini.
   */
  const join = async (c: Community) => {
    const url = joinUrl(c);
    // Bukan fitur 'noopener': dengan itu window.open selalu null dan blokir
    // pop-up tidak bisa dikenali. opener diputus manual.
    const w = url ? window.open(url, '_blank') : null;
    if (w) w.opener = null;
    setPending(c.slug);
    try {
      await repo.joinCommunity(c.slug);
      mine.update((list) => (list.includes(c.slug) ? list : [...list, c.slug]));
      toast(url ? `${c.name} ditambahkan. Grupnya dibuka di tab baru.` : `${c.name} ditambahkan ke Passport.`);
      if (url && !w) toast('Browser memblokir tab baru. Buka grupnya lewat tombol Buka grup.', 'error');
      focusLater('ps2-mine-title');
      void reload();
    } catch (e) {
      toast(errMsg(e, 'Gagal menambahkan komunitas.'), 'error');
    } finally {
      setPending(null);
    }
  };

  // ?gabung=slug dari halaman detail komunitas langsung menambahkan komunitas itu.
  const gabungParam = params.get('gabung');
  const sudahGabung = useRef(false);
  useEffect(() => {
    if (!gabungParam || !mine.data || sudahGabung.current || joined.has(gabungParam)) return;
    const c = COMMUNITIES.find((x) => x.slug === gabungParam);
    if (!c) return;
    sudahGabung.current = true;
    // Tanpa klik, tab baru akan diblokir browser; grupnya cukup ditawarkan.
    void repo.joinCommunity(c.slug).then(
      () => {
        mine.update((list) => (list.includes(c.slug) ? list : [...list, c.slug]));
        toast(`${c.name} ditambahkan ke Passport.`);
        void reload();
      },
      (e) => toast(errMsg(e, 'Gagal menambahkan komunitas.'), 'error'),
    );
  }, [gabungParam, mine, joined, repo, toast, reload]);

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
        lead="Tambahkan komunitas mitra yang Anda ikuti. Saat ditambahkan, grup komunitasnya langsung terbuka supaya Anda bisa bergabung."
      />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="ps2-grid-2">
          <Card id="ps2-mine-title" title="Komunitas saya" aside={mine.data ? <span className="ps2-pill">{mine.data.length} komunitas</span> : undefined}>
            {mine.error ? (
              <ErrorState message={mine.error} onRetry={mine.retry} />
            ) : !mine.data ? (
              <Skeleton rows={3} height={64} label="Memuat komunitas Anda…" />
            ) : mine.data.length === 0 ? (
              <EmptyState icon="users" title="Belum ada komunitas">
                Pilih komunitas di bagian Temukan komunitas. Grupnya langsung terbuka di tab baru.
              </EmptyState>
            ) : (
              <ul className="ps2-comms">
                {mine.data.map((slug) => {
                  const c = COMMUNITIES.find((x) => x.slug === slug) ?? null;
                  const name = c?.name ?? slug;
                  const visible = c && c.status !== 'hidden';
                  const url = joinUrl(c);
                  return (
                    <li key={slug} className="ps2-comm">
                      <Logo c={c} name={name} />
                      <div className="ps2-comm-txt">
                        {visible ? <Link href={`/communities/${encodeURIComponent(slug)}`}>{name}</Link> : <b>{name}</b>}
                        <small>{c?.category ?? 'Komunitas tidak lagi ditampilkan'}</small>
                      </div>
                      <div className="cm-act">
                        {url && (
                          <a className="ui-btn ui-btn-ghost ps2-btn-sm" href={url} target="_blank" rel="noopener noreferrer">
                            Buka grup
                            <Icon name="external" />
                          </a>
                        )}
                        <button
                          type="button"
                          className="ui-btn ui-btn-ghost ps2-btn-sm"
                          onClick={() => setLeaving({ slug, name })}
                          disabled={pending === slug}
                          aria-label={`Keluar dari ${name}`}
                        >
                          Keluar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card id="ps2-rewards-title" title="Komunitas di Journey">
            <ul className="cm-info">
              <li>
                <Icon name="users" />
                <span>
                  <b>Bebas bergabung</b>
                  <small>Tidak perlu verifikasi. Komunitas langsung tampil di Passport publik Anda.</small>
                </span>
              </li>
              <li>
                <Icon name="j-connector" />
                <span>
                  <b>Syarat tahap Connector</b>
                  <small>Lima komunitas ditambah mengikuti lima orang membuka tahap Connector.</small>
                </span>
              </li>
              <li>
                <Icon name="bolt" />
                <span>
                  <b>Tidak memberi poin CATA</b>
                  <small>Poin CATA berasal dari tahap Journey dan profil yang lengkap, bukan dari jumlah komunitas.</small>
                </span>
              </li>
            </ul>
          </Card>
        </div>

        <Card id="ps2-discover-title" title="Temukan komunitas">
          <div className="ps2-filters" role="group" aria-label="Saring menurut channel">
            <button type="button" className="ps2-chip" aria-pressed={channel === 'all'} onClick={() => setChannel('all')}>
              Semua
            </button>
            {CHANNELS.map((ch) => (
              <button key={ch.key} type="button" className="ps2-chip" aria-pressed={channel === ch.key} onClick={() => setChannel(ch.key)}>
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
                ? 'Anda sudah menambahkan semua komunitas mitra.'
                : `Tidak ada komunitas ${CHANNEL_LABEL.get(channel) ?? ''} yang belum Anda tambahkan.`}
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
                    aria-label={`Tambahkan ${c.name}${joinUrl(c) ? ' dan buka grupnya' : ''}`}
                  >
                    {pending === c.slug ? 'Menambahkan…' : 'Tambahkan'}
                    {joinUrl(c) && <Icon name="external" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ConfirmDialog
          open={!!leaving}
          title="Keluar dari komunitas?"
          message={<p>{leaving?.name} akan dihapus dari Passport Anda.</p>}
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

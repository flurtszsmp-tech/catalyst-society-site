'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import type { ProfileSummary } from '@/lib/types';
import { SLUG_PATTERN } from '@/lib/repo/types';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHead,
  PersonAvatar,
  SessionGate,
  Skeleton,
  errMsg,
  fmtNumber,
  useLoad,
} from './common';
import { STAGE_INFO } from './labels';

type Tab = 'following' | 'followers';
const TABS: { key: Tab; label: string }[] = [
  { key: 'following', label: 'Mengikuti' },
  { key: 'followers', label: 'Pengikut' },
];

const DEBOUNCE_MS = 300;

interface Lists {
  following: ProfileSummary[];
  followers: ProfileSummary[];
}

interface SearchState {
  /** Kata kunci yang dijawab oleh list/error; null berarti belum ada jawaban. */
  q: string | null;
  list: ProfileSummary[] | null;
  error: string | null;
}

export function ConnectionsSection() {
  const { repo, user, loading, error, reload } = usePassport();
  const toast = useToast();
  const params = useSearchParams();
  const uid = user?.id ?? null;

  const load = useMemo(
    () =>
      uid
        ? async (): Promise<Lists> => {
            const [following, followers] = await Promise.all([repo.listFollowing(uid), repo.listFollowers(uid)]);
            return { following, followers };
          }
        : null,
    [repo, uid],
  );
  const lists = useLoad(load);

  const [tab, setTab] = useState<Tab>('following');
  const [pending, setPending] = useState<string | null>(null);

  // ?q= mengisi kolom pencarian. Bila ?q= berganti (pencarian dari bilah
  // atas saat sudah di halaman ini), kolom ikut berganti; di luar itu
  // kolom sepenuhnya milik pengguna.
  const qParam = (params.get('q') ?? '').slice(0, 60);
  const [query, setQuery] = useState(qParam);
  const [qLalu, setQLalu] = useState(qParam);
  if (qParam !== qLalu) {
    setQLalu(qParam);
    setQuery(qParam);
  }
  const [search, setSearch] = useState<SearchState>({ q: null, list: null, error: null });
  const [nonce, setNonce] = useState(0);
  const wanted = query.trim();

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const t = setTimeout(() => {
      repo.searchProfiles(wanted).then(
        (list) => {
          if (alive) setSearch({ q: wanted, list, error: null });
        },
        (e: unknown) => {
          if (alive) setSearch({ q: wanted, list: null, error: errMsg(e, 'Gagal mencari profil.') });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [repo, uid, wanted, nonce]);

  const searching = search.q !== wanted || (!search.list && !search.error);
  const followingIds = useMemo(() => new Set((lists.data?.following ?? []).map((p) => p.id)), [lists.data]);

  const toggleFollow = async (p: ProfileSummary) => {
    if (!lists.data) return;
    const isFollowing = followingIds.has(p.id);
    setPending(p.id);
    try {
      if (isFollowing) {
        await repo.unfollow(p.id);
        lists.update((d) => ({ ...d, following: d.following.filter((x) => x.id !== p.id) }));
        toast(`Berhenti mengikuti ${p.fullName}.`);
      } else {
        await repo.follow(p.id);
        lists.update((d) => ({ ...d, following: [p, ...d.following.filter((x) => x.id !== p.id)] }));
        toast(`Anda mengikuti ${p.fullName}.`);
      }
    } catch (e) {
      toast(errMsg(e, 'Gagal memperbarui koneksi.'), 'error');
    } finally {
      setPending(null);
    }
  };

  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ following: null, followers: null });
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === tab);
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? TABS.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].key);
    tabRefs.current[TABS[next].key]?.focus();
  };

  const row = (p: ProfileSummary) => (
    <PersonRow
      key={p.id}
      p={p}
      following={followingIds.has(p.id)}
      busy={pending === p.id}
      disabled={!lists.data || pending !== null}
      onToggle={() => void toggleFollow(p)}
    />
  );

  const shown = lists.data ? lists.data[tab] : null;
  const results = search.q === wanted ? (search.list ?? []).filter((p) => p.id !== uid) : [];

  return (
    <div className="ps2">
      <PageHead title="Koneksi" lead="Orang yang Anda ikuti dan yang mengikuti Anda di Catalyst Society." />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="ps2-grid-2">
          <Card id="ps2-conn-title" title="Jaringan saya">
            <div className="ps2-tabs" role="tablist" aria-label="Daftar koneksi">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  ref={(el) => {
                    tabRefs.current[t.key] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`ps2-tab-${t.key}`}
                  className="ps2-tab"
                  aria-selected={tab === t.key}
                  aria-controls="ps2-tabpanel"
                  tabIndex={tab === t.key ? 0 : -1}
                  onClick={() => setTab(t.key)}
                  onKeyDown={onTabKey}
                >
                  {t.label}
                  {lists.data && <span>{fmtNumber(lists.data[t.key].length)}</span>}
                </button>
              ))}
            </div>
            <div id="ps2-tabpanel" role="tabpanel" aria-labelledby={`ps2-tab-${tab}`}>
              {lists.error ? (
                <ErrorState message={lists.error} onRetry={lists.retry} />
              ) : !shown ? (
                <Skeleton rows={4} height={48} label="Memuat koneksi…" />
              ) : shown.length === 0 ? (
                <EmptyState icon="network" title={tab === 'following' ? 'Belum mengikuti siapa pun' : 'Belum ada pengikut'}>
                  {tab === 'following'
                    ? 'Cari orang di sebelah dan ikuti mereka untuk membangun jaringan Anda.'
                    : 'Bagikan Passport publik Anda supaya orang lain bisa menemukan dan mengikuti Anda.'}
                </EmptyState>
              ) : (
                <ul className="ps2-list ps2-people">{shown.map(row)}</ul>
              )}
            </div>
          </Card>

          <Card id="ps2-find-title" title="Temukan orang">
            <div className="ps2-search">
              <Icon name="search" />
              <label htmlFor="ps2-q" className="sr-only">
                Cari nama atau headline
              </label>
              <input
                id="ps2-q"
                type="search"
                className="ui-input"
                placeholder="Cari nama atau headline"
                value={query}
                maxLength={60}
                onChange={(e) => setQuery(e.target.value)}
                aria-describedby="ps2-q-status"
                autoComplete="off"
              />
            </div>
            <p id="ps2-q-status" className="sr-only" role="status" aria-live="polite">
              {searching ? 'Mencari…' : search.error ? '' : `${results.length} profil ditemukan.`}
            </p>
            {search.error && search.q === wanted ? (
              <ErrorState message={search.error} onRetry={() => {
                  setSearch({ q: null, list: null, error: null });
                  setNonce((n) => n + 1);
                }} />
            ) : searching ? (
              <Skeleton rows={4} height={48} label="Mencari profil…" />
            ) : results.length === 0 ? (
              <EmptyState icon="search" title={wanted ? 'Tidak ada yang cocok' : 'Belum ada profil publik'}>
                {wanted
                  ? `Tidak ada profil publik dengan nama atau headline “${wanted}”.`
                  : 'Profil publik anggota lain akan muncul di sini.'}
              </EmptyState>
            ) : (
              <>
                {!wanted && <p className="ps2-sub">Anggota dengan poin CATA tertinggi.</p>}
                <ul className="ps2-list ps2-people">{results.map(row)}</ul>
              </>
            )}
          </Card>
        </div>
      </SessionGate>
    </div>
  );
}

function PersonRow({
  p,
  following,
  busy,
  disabled,
  onToggle,
}: {
  p: ProfileSummary;
  following: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  // Slug dijaga CHECK di database; diperiksa ulang karena data demo bisa diubah di perangkat.
  const href = SLUG_PATTERN.test(p.slug) ? `/p/?u=${p.slug}` : null;
  const body = (
    <>
      <PersonAvatar person={p} size={40} />
      <span>
        <b>
          {p.fullName}
          {p.isVerified && <Icon name="verified" title="Terverifikasi" />}
        </b>
        <small>{p.headline || STAGE_INFO[p.journeyStage]?.name}</small>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link className="ps2-person" href={href}>
          {body}
        </Link>
      ) : (
        <div className="ps2-person">{body}</div>
      )}
      <button
        type="button"
        className={`ui-btn ps2-btn-sm ${following ? 'ui-btn-ghost' : 'ui-btn-primary'}`}
        onClick={onToggle}
        disabled={disabled}
        aria-busy={busy || undefined}
        aria-label={`${following ? 'Batal ikuti' : 'Ikuti'} ${p.fullName}`}
      >
        {busy ? 'Memproses…' : following ? 'Batal ikuti' : 'Ikuti'}
      </button>
    </li>
  );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS } from '@/lib/data/communities';
import { DEFAULT_PEOPLE_FILTER, STAGES, type Channel, type PeopleFilter, type ProfileSummary, type Stage } from '@/lib/types';
import { SLUG_PATTERN } from '@/lib/repo/types';
import { Card, EmptyState, ErrorState, PageHead, PersonAvatar, SessionGate, Skeleton, errMsg, fmtNumber, useLoad } from './common';
import { STAGE_INFO } from './labels';

type Tab = 'following' | 'followers';
const TABS: { key: Tab; label: string }[] = [
  { key: 'following', label: 'Mengikuti' },
  { key: 'followers', label: 'Pengikut' },
];

const DEBOUNCE_MS = 300;

const SORT: { key: PeopleFilter['sort']; label: string }[] = [
  { key: 'points_desc', label: 'Poin CATA tertinggi' },
  { key: 'points_asc', label: 'Poin CATA terendah' },
  { key: 'newest', label: 'Anggota terbaru' },
];

const CHANNEL_LABEL = new Map<string, string>(CHANNELS.map((c) => [c.key, c.label.id]));

interface Lists {
  following: ProfileSummary[];
  followers: ProfileSummary[];
}

interface SearchState {
  /** Kunci saringan yang dijawab oleh list/error; null berarti belum ada jawaban. */
  key: string | null;
  list: ProfileSummary[] | null;
  error: string | null;
}

export function ConnectionsSection() {
  const { repo, user, profile, loading, error, reload } = usePassport();
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

  // ?q= mengisi kolom pencarian, misalnya dari pencarian di bilah atas.
  const qParam = (params.get('q') ?? '').slice(0, 60);
  const [filter, setFilter] = useState<PeopleFilter>({ ...DEFAULT_PEOPLE_FILTER, query: qParam });
  const [qLalu, setQLalu] = useState(qParam);
  if (qParam !== qLalu) {
    setQLalu(qParam);
    setFilter((f) => ({ ...f, query: qParam }));
  }
  const ubah = <K extends keyof PeopleFilter>(k: K, v: PeopleFilter[K]) => setFilter((f) => ({ ...f, [k]: v }));

  const [search, setSearch] = useState<SearchState>({ key: null, list: null, error: null });
  const [nonce, setNonce] = useState(0);
  const wanted = useMemo(() => JSON.stringify({ ...filter, query: filter.query.trim() }), [filter]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const f = JSON.parse(wanted) as PeopleFilter;
    const t = setTimeout(() => {
      repo.searchPeople(f).then(
        (list) => {
          if (alive) setSearch({ key: wanted, list, error: null });
        },
        (e: unknown) => {
          if (alive) setSearch({ key: wanted, list: null, error: errMsg(e, 'Gagal mencari profil.') });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [repo, uid, wanted, nonce]);

  const searching = search.key !== wanted || (!search.list && !search.error);
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
        // Koneksi kelima bisa menaikkan tahap Connector; profil disegarkan.
        void reload();
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
      e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].key);
    tabRefs.current[TABS[next].key]?.focus();
  };

  const mySkills = useMemo(() => new Set((profile?.skills ?? []).map((s) => s.toLowerCase())), [profile?.skills]);
  const myRoles = useMemo(() => new Set((profile?.roles ?? []).map((s) => s.toLowerCase())), [profile?.roles]);

  const row = (p: ProfileSummary, detail: boolean) => (
    <PersonRow
      key={p.id}
      p={p}
      detail={detail}
      shared={detail ? [...(p.skills ?? []).filter((s) => mySkills.has(s.toLowerCase())), ...(p.roles ?? []).filter((s) => myRoles.has(s.toLowerCase()))] : []}
      following={followingIds.has(p.id)}
      busy={pending === p.id}
      disabled={!lists.data || pending !== null}
      onToggle={() => void toggleFollow(p)}
    />
  );

  const shown = lists.data ? lists.data[tab] : null;
  const results = search.key === wanted ? (search.list ?? []).filter((p) => p.id !== uid) : [];
  const aktif =
    !!filter.channel || !!filter.stage || filter.sameBadges || filter.sameSkills || filter.sameRoles || !!filter.query.trim();
  const butuhIsian =
    (filter.sameSkills && !(profile?.skills.length ?? 0)) || (filter.sameRoles && !(profile?.roles.length ?? 0));

  return (
    <div className="ps2">
      <PageHead title="Koneksi" lead="Temukan builders, mentor, dan investor baru di Catalyst Society, lalu bangun jaringan Anda." />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="ps2-grid-2 cn-grid">
          <Card id="ps2-find-title" title="Temukan orang" className="cn-find">
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
                value={filter.query}
                maxLength={60}
                onChange={(e) => ubah('query', e.target.value)}
                aria-describedby="ps2-q-status"
                autoComplete="off"
              />
            </div>

            <div className="cn-filters" role="group" aria-label="Saringan pencarian">
              <label className="cn-select">
                <span>Industri</span>
                <select value={filter.channel ?? ''} onChange={(e) => ubah('channel', (e.target.value || null) as Channel | null)}>
                  <option value="">Semua industri</option>
                  {profile?.channel && <option value={profile.channel}>Sama dengan saya</option>}
                  {CHANNELS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cn-select">
                <span>Tahap Journey</span>
                <select value={filter.stage ?? ''} onChange={(e) => ubah('stage', (e.target.value || null) as Stage | null)}>
                  <option value="">Semua tahap</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_INFO[s].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cn-select">
                <span>Urutkan</span>
                <select value={filter.sort} onChange={(e) => ubah('sort', e.target.value as PeopleFilter['sort'])}>
                  {SORT.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="ps2-filters cn-chips" role="group" aria-label="Kesamaan dengan saya">
              <button type="button" className="ps2-chip" aria-pressed={filter.sameBadges} onClick={() => ubah('sameBadges', !filter.sameBadges)}>
                Badges yang sama
              </button>
              <button type="button" className="ps2-chip" aria-pressed={filter.sameSkills} onClick={() => ubah('sameSkills', !filter.sameSkills)}>
                Skills serupa
              </button>
              <button type="button" className="ps2-chip" aria-pressed={filter.sameRoles} onClick={() => ubah('sameRoles', !filter.sameRoles)}>
                Roles serupa
              </button>
              <button type="button" className="ps2-chip" aria-pressed={filter.hideFollowing} onClick={() => ubah('hideFollowing', !filter.hideFollowing)}>
                Hanya kenalan baru
              </button>
              {aktif && (
                <button type="button" className="cn-reset" onClick={() => setFilter({ ...DEFAULT_PEOPLE_FILTER })}>
                  Hapus saringan
                </button>
              )}
            </div>

            <p id="ps2-q-status" className="sr-only" role="status" aria-live="polite">
              {searching ? 'Mencari…' : search.error ? '' : `${results.length} profil ditemukan.`}
            </p>
            {butuhIsian ? (
              <EmptyState icon="skills" title="Lengkapi skills dan roles Anda">
                Saringan serupa membandingkan dengan skills dan roles di Passport Anda.{' '}
                <Link className="ps2-link" href="/passport/skills">
                  Isi sekarang
                </Link>
              </EmptyState>
            ) : search.error && search.key === wanted ? (
              <ErrorState
                message={search.error}
                onRetry={() => {
                  setSearch({ key: null, list: null, error: null });
                  setNonce((n) => n + 1);
                }}
              />
            ) : searching ? (
              <Skeleton rows={4} height={64} label="Mencari profil…" />
            ) : results.length === 0 ? (
              <EmptyState icon="search" title={aktif ? 'Tidak ada yang cocok' : 'Belum ada kenalan baru'}>
                {aktif
                  ? 'Coba longgarkan saringan atau ganti kata kunci.'
                  : 'Anda sudah mengikuti semua profil publik. Matikan "Hanya kenalan baru" untuk melihat semuanya.'}
              </EmptyState>
            ) : (
              <>
                <p className="ps2-sub">
                  {fmtNumber(results.length)} orang · {SORT.find((s) => s.key === filter.sort)?.label}
                </p>
                <ul className="ps2-list ps2-people cn-people">{results.map((p) => row(p, true))}</ul>
              </>
            )}
          </Card>

          <Card id="ps2-conn-title" title="Jaringan saya" className="cn-mine">
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
                <Skeleton rows={3} height={48} label="Memuat koneksi…" />
              ) : shown.length === 0 ? (
                <EmptyState icon="network" title={tab === 'following' ? 'Belum mengikuti siapa pun' : 'Belum ada pengikut'}>
                  {tab === 'following'
                    ? 'Ikuti lima orang untuk memenuhi salah satu syarat tahap Connector.'
                    : 'Bagikan Passport publik Anda supaya orang lain bisa menemukan dan mengikuti Anda.'}
                </EmptyState>
              ) : (
                <ul className="ps2-list ps2-people">{shown.map((p) => row(p, false))}</ul>
              )}
            </div>
          </Card>
        </div>
      </SessionGate>
    </div>
  );
}

function PersonRow({
  p,
  detail,
  shared,
  following,
  busy,
  disabled,
  onToggle,
}: {
  p: ProfileSummary;
  detail: boolean;
  shared: string[];
  following: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  // Slug dijaga CHECK di database; diperiksa ulang karena data demo bisa diubah di perangkat.
  const href = SLUG_PATTERN.test(p.slug) ? `/p/?u=${p.slug}` : null;
  const body = (
    <>
      <PersonAvatar person={p} size={detail ? 46 : 40} />
      <span>
        <b>
          {p.fullName}
          {p.isVerified && <Icon name="verified" title="Terverifikasi" />}
        </b>
        <small>{p.headline || STAGE_INFO[p.journeyStage]?.name}</small>
        {detail && (
          <span className="cn-meta">
            <span className="cn-tag">{STAGE_INFO[p.journeyStage]?.name}</span>
            {p.channel && <span className="cn-tag">{CHANNEL_LABEL.get(p.channel) ?? p.channel}</span>}
            <span className="cn-pts">
              <Icon name="bolt" />
              {fmtNumber(p.cataPoints ?? 0)}
            </span>
            {shared.slice(0, 3).map((s) => (
              <span key={s} className="cn-tag is-shared" title="Sama dengan Anda">
                {s}
              </span>
            ))}
          </span>
        )}
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

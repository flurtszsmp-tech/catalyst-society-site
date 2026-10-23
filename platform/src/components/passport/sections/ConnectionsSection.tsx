'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { CHANNELS } from '@/lib/data/communities';
import { DEFAULT_PEOPLE_FILTER, STAGES, type Channel, type PeopleFilter, type ProfileSummary, type Stage } from '@/lib/types';
import { SLUG_PATTERN } from '@/lib/repo/types';
import { EmptyState, ErrorState, PageHead, PersonAvatar, SessionGate, Skeleton, errMsg, fmtNumber, useLoad } from './common';
import { STAGE_INFO } from './labels';

type Tab = 'discover' | 'following' | 'followers';

const DEBOUNCE_MS = 300;

const SORT: { key: PeopleFilter['sort']; label: string }[] = [
  { key: 'points_desc', label: 'Poin tertinggi' },
  { key: 'points_asc', label: 'Poin terendah' },
  { key: 'newest', label: 'Terbaru' },
];

const CHANNEL_LABEL = new Map<string, string>(CHANNELS.map((c) => [c.key, c.label.id]));

interface Lists {
  following: ProfileSummary[];
  followers: ProfileSummary[];
}

interface SearchState {
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

  const [tab, setTab] = useState<Tab>('discover');
  const [pending, setPending] = useState<string | null>(null);
  /** Menu saringan yang sedang terbuka. */
  const [buka, setBuka] = useState<'industri' | 'tahap' | 'mirip' | null>(null);
  const pilihMenu = (f: () => void) => {
    f();
    setBuka(null);
  };

  // ?q= mengisi kolom pencarian, misalnya dari pencarian di bilah atas.
  const qParam = (params.get('q') ?? '').slice(0, 60);
  const [filter, setFilter] = useState<PeopleFilter>({ ...DEFAULT_PEOPLE_FILTER, query: qParam });
  const [qLalu, setQLalu] = useState(qParam);
  if (qParam !== qLalu) {
    setQLalu(qParam);
    setFilter((f) => ({ ...f, query: qParam }));
    setTab('discover');
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
        (list) => alive && setSearch({ key: wanted, list, error: null }),
        (e: unknown) => alive && setSearch({ key: wanted, list: null, error: errMsg(e, 'Gagal mencari profil.') }),
      );
    }, DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [repo, uid, wanted, nonce]);

  const searching = search.key !== wanted || (!search.list && !search.error);
  const followingIds = useMemo(() => new Set((lists.data?.following ?? []).map((p) => p.id)), [lists.data]);
  const followerIds = useMemo(() => new Set((lists.data?.followers ?? []).map((p) => p.id)), [lists.data]);

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

  const mySkills = useMemo(() => new Set((profile?.skills ?? []).map((s) => s.toLowerCase())), [profile?.skills]);
  const myRoles = useMemo(() => new Set((profile?.roles ?? []).map((s) => s.toLowerCase())), [profile?.roles]);
  const shared = (p: ProfileSummary) => [
    ...(p.skills ?? []).filter((s) => mySkills.has(s.toLowerCase())),
    ...(p.roles ?? []).filter((s) => myRoles.has(s.toLowerCase())),
  ];

  const results = search.key === wanted ? (search.list ?? []).filter((p) => p.id !== uid) : [];

  /* ---------- saringan aktif sebagai pil yang bisa dilepas ---------- */
  const pil: { key: string; label: string; off: () => void }[] = [];
  if (filter.query.trim()) pil.push({ key: 'q', label: `“${filter.query.trim()}”`, off: () => ubah('query', '') });
  if (filter.channel) pil.push({ key: 'ch', label: CHANNEL_LABEL.get(filter.channel) ?? filter.channel, off: () => ubah('channel', null) });
  if (filter.stage) pil.push({ key: 'st', label: STAGE_INFO[filter.stage].name, off: () => ubah('stage', null) });
  if (filter.sameBadges) pil.push({ key: 'b', label: 'Badges sama', off: () => ubah('sameBadges', false) });
  if (filter.sameSkills) pil.push({ key: 'sk', label: 'Skills serupa', off: () => ubah('sameSkills', false) });
  if (filter.sameRoles) pil.push({ key: 'r', label: 'Roles serupa', off: () => ubah('sameRoles', false) });
  const butuhIsian = (filter.sameSkills && !(profile?.skills.length ?? 0)) || (filter.sameRoles && !(profile?.roles.length ?? 0));

  const jumlah = (n: number | undefined) => (lists.data ? fmtNumber(n ?? 0) : '…');

  return (
    <div className="ps2">
      <PageHead title="Koneksi" lead="Temukan builders, mentor, dan investor baru di Catalyst Society, lalu bangun jaringan Anda." />
      <SessionGate loading={loading} error={error} onRetry={() => void reload()}>
        <div className="cx-tabs" role="tablist" aria-label="Koneksi">
          {(
            [
              { key: 'discover', label: 'Temukan orang', icon: 'search', n: null },
              { key: 'following', label: 'Mengikuti', icon: 'user-check', n: lists.data?.following.length },
              { key: 'followers', label: 'Pengikut', icon: 'users', n: lists.data?.followers.length },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`cx-tab${tab === t.key ? ' on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} />
              {t.label}
              {t.n !== null && <span className="cx-count">{jumlah(t.n)}</span>}
            </button>
          ))}
        </div>

        {tab === 'discover' ? (
          <div className="cx-wrap">
            <div className="cx-hero">
              <div className="ps2-search cx-search">
                <Icon name="search" />
                <label htmlFor="ps2-q" className="sr-only">
                  Cari nama atau headline
                </label>
                <input
                  id="ps2-q"
                  type="search"
                  className="ui-input"
                  placeholder="Cari nama, headline, atau peran"
                  value={filter.query}
                  maxLength={60}
                  onChange={(e) => ubah('query', e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="cx-toolbar" role="toolbar" aria-label="Saringan">
                <Dropdown
                  id="industri"
                  open={buka === 'industri'}
                  onToggle={() => setBuka((b) => (b === 'industri' ? null : 'industri'))}
                  onClose={() => setBuka(null)}
                  active={!!filter.channel}
                  label={filter.channel ? (CHANNEL_LABEL.get(filter.channel) ?? 'Industri') : 'Industri'}
                  icon="briefcase"
                >
                  <MenuOpt on={!filter.channel} onClick={() => pilihMenu(() => ubah('channel', null))}>
                    Semua industri
                  </MenuOpt>
                  {CHANNELS.map((c) => (
                    <MenuOpt key={c.key} on={filter.channel === c.key} onClick={() => pilihMenu(() => ubah('channel', c.key as Channel))}>
                      {c.label.id}
                      {profile?.channel === c.key && <em>Industri Anda</em>}
                    </MenuOpt>
                  ))}
                </Dropdown>

                <Dropdown
                  id="tahap"
                  open={buka === 'tahap'}
                  onToggle={() => setBuka((b) => (b === 'tahap' ? null : 'tahap'))}
                  onClose={() => setBuka(null)}
                  active={!!filter.stage}
                  label={filter.stage ? STAGE_INFO[filter.stage].name : 'Tahap Journey'}
                  icon="journey"
                >
                  <MenuOpt on={!filter.stage} onClick={() => pilihMenu(() => ubah('stage', null))}>
                    Semua tahap
                  </MenuOpt>
                  {STAGES.map((st) => (
                    <MenuOpt key={st} on={filter.stage === st} onClick={() => pilihMenu(() => ubah('stage', st as Stage))}>
                      <Icon name={`j-${st}`} />
                      {STAGE_INFO[st].name}
                    </MenuOpt>
                  ))}
                </Dropdown>

                <Dropdown
                  id="mirip"
                  open={buka === 'mirip'}
                  onToggle={() => setBuka((b) => (b === 'mirip' ? null : 'mirip'))}
                  onClose={() => setBuka(null)}
                  active={filter.sameBadges || filter.sameSkills || filter.sameRoles}
                  label={`Kesamaan${[filter.sameBadges, filter.sameSkills, filter.sameRoles].filter(Boolean).length ? ` · ${[filter.sameBadges, filter.sameSkills, filter.sameRoles].filter(Boolean).length}` : ''}`}
                  icon="link"
                  wide
                >
                  <Switch on={filter.sameBadges} onChange={(v) => ubah('sameBadges', v)} title="Badges yang sama" sub="Punya setidaknya satu lencana seperti Anda" />
                  <Switch on={filter.sameSkills} onChange={(v) => ubah('sameSkills', v)} title="Skills serupa" sub={profile?.skills.length ? profile.skills.slice(0, 3).join(', ') : 'Isi skills Anda dulu'} />
                  <Switch on={filter.sameRoles} onChange={(v) => ubah('sameRoles', v)} title="Roles serupa" sub={profile?.roles.length ? profile.roles.slice(0, 3).join(', ') : 'Isi roles Anda dulu'} />
                </Dropdown>

                <button type="button" className={`cx-chip${filter.hideFollowing ? ' on' : ''}`} aria-pressed={filter.hideFollowing} onClick={() => ubah('hideFollowing', !filter.hideFollowing)}>
                  <Icon name={filter.hideFollowing ? 'check' : 'user-plus'} />
                  Hanya kenalan baru
                </button>

                <span className="cx-spacer" />

                <label className="cx-sort-wrap">
                  <span>Urutkan</span>
                  <select value={filter.sort} onChange={(e) => ubah('sort', e.target.value as PeopleFilter['sort'])}>
                    {SORT.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <section className="cx-main" aria-labelledby="cx-hasil">
              <div className="cx-summary">
                <h2 id="cx-hasil">
                  {searching ? 'Mencari…' : `${fmtNumber(results.length)} orang`}
                  <small>{filter.hideFollowing ? 'yang belum Anda ikuti' : 'di Catalyst Society'}</small>
                </h2>
                {pil.length > 0 && (
                  <ul className="cx-pills" aria-label="Saringan aktif">
                    <li>
                      <button type="button" className="cx-pills-reset" onClick={() => setFilter({ ...DEFAULT_PEOPLE_FILTER, hideFollowing: filter.hideFollowing })}>
                        Hapus semua
                      </button>
                    </li>
                    {pil.map((p) => (
                      <li key={p.key}>
                        <button type="button" onClick={p.off} aria-label={`Hapus saringan ${p.label}`}>
                          {p.label}
                          <Icon name="close" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="sr-only" role="status" aria-live="polite">
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
                <div className="cx-grid" aria-busy="true">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="ui-skeleton cx-skel" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState icon="search" title={pil.length ? 'Tidak ada yang cocok' : 'Belum ada kenalan baru'}>
                  {pil.length
                    ? 'Coba longgarkan saringan atau ganti kata kunci.'
                    : 'Anda sudah mengikuti semua profil publik. Matikan "Hanya kenalan baru" untuk melihat semuanya.'}
                </EmptyState>
              ) : (
                <ul className="cx-grid">
                  {results.map((p) => (
                    <PersonCard
                      key={p.id}
                      p={p}
                      shared={shared(p)}
                      followsYou={followerIds.has(p.id)}
                      following={followingIds.has(p.id)}
                      busy={pending === p.id}
                      disabled={!lists.data || pending !== null}
                      onToggle={() => void toggleFollow(p)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <section className="ps2-card cx-network" aria-label={tab === 'following' ? 'Orang yang Anda ikuti' : 'Pengikut Anda'}>
            {lists.error ? (
              <ErrorState message={lists.error} onRetry={lists.retry} />
            ) : !lists.data ? (
              <Skeleton rows={4} height={56} label="Memuat koneksi…" />
            ) : lists.data[tab].length === 0 ? (
              <EmptyState icon="network" title={tab === 'following' ? 'Belum mengikuti siapa pun' : 'Belum ada pengikut'}>
                {tab === 'following'
                  ? 'Ikuti lima orang untuk memenuhi salah satu syarat tahap Connector.'
                  : 'Bagikan Passport publik Anda supaya orang lain bisa menemukan dan mengikuti Anda.'}
              </EmptyState>
            ) : (
              <ul className="ps2-list ps2-people">
                {lists.data[tab].map((p) => (
                  <PersonRow
                    key={p.id}
                    p={p}
                    following={followingIds.has(p.id)}
                    busy={pending === p.id}
                    disabled={pending !== null}
                    onToggle={() => void toggleFollow(p)}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </SessionGate>
    </div>
  );
}

/* ---------- menu saringan ---------- */

function Dropdown({
  id,
  open,
  onToggle,
  onClose,
  active,
  label,
  icon,
  wide = false,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  active: boolean;
  label: string;
  icon: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Klik di luar menu atau Escape menutupnya, seperti menu di LinkedIn.
  useEffect(() => {
    if (!open) return;
    const luar = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', luar);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', luar);
      document.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);

  return (
    <div className="cx-dd" ref={ref}>
      <button
        type="button"
        className={`cx-chip${active ? ' on' : ''}${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-controls={`cx-dd-${id}`}
        onClick={onToggle}
      >
        <Icon name={icon} />
        {label}
        <Icon name="chevron" className="cx-chev" />
      </button>
      {open && (
        <div className={`cx-menu${wide ? ' wide' : ''}`} id={`cx-dd-${id}`} role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuOpt({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={on} className={`cx-mopt${on ? ' on' : ''}`} onClick={onClick}>
      <span className="cx-mopt-txt">{children}</span>
      {on && <Icon name="check" className="cx-mopt-ok" />}
    </button>
  );
}

function Switch({ on, onChange, title, sub }: { on: boolean; onChange: (v: boolean) => void; title: string; sub: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`cx-switch${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <span className="cx-switch-txt">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
      <span className="cx-knob" aria-hidden />
    </button>
  );
}

/* ---------- kartu orang ---------- */

function profilHref(slug: string): string | null {
  // Slug dijaga CHECK di database; diperiksa ulang karena data demo bisa diubah di perangkat.
  return SLUG_PATTERN.test(slug) ? `/pass/${slug}` : null;
}

function PersonCard({
  p,
  shared,
  followsYou,
  following,
  busy,
  disabled,
  onToggle,
}: {
  p: ProfileSummary;
  shared: string[];
  followsYou: boolean;
  following: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const href = profilHref(p.slug);
  return (
    <li className={`cx-card ch-${p.channel ?? 'none'}`}>
      <span className="cx-cover" aria-hidden />
      <div className="cx-card-body">
        <span className="cx-avatar">
          <PersonAvatar person={p} size={64} />
        </span>
        {followsYou && <span className="cx-follows">Mengikuti Anda</span>}
        <h3>
          {href ? <a href={href}>{p.fullName}</a> : p.fullName}
          {p.isVerified && <Icon name="verified" title="Terverifikasi" />}
        </h3>
        <p className="cx-headline">{p.headline || 'Anggota Catalyst Society'}</p>
        <div className="cx-tags">
          <span className={`cx-tag cx-stage stg-${p.journeyStage}`}>
            <Icon name={`j-${p.journeyStage}`} />
            {STAGE_INFO[p.journeyStage]?.name}
          </span>
          {p.channel && <span className="cx-tag">{CHANNEL_LABEL.get(p.channel) ?? p.channel}</span>}
          <span className="cx-tag cx-pts">
            <Icon name="bolt" />
            {fmtNumber(p.cataPoints ?? 0)}
          </span>
        </div>
        {shared.length > 0 && (
          <p className="cx-shared">
            <Icon name="link" />
            Sama dengan Anda: {shared.slice(0, 3).join(', ')}
          </p>
        )}
        <div className="cx-actions">
          <button
            type="button"
            className={`ui-btn ps2-btn-sm ${following ? 'ui-btn-ghost' : 'ui-btn-primary'}`}
            onClick={onToggle}
            disabled={disabled}
            aria-busy={busy || undefined}
            aria-label={`${following ? 'Batal ikuti' : 'Ikuti'} ${p.fullName}`}
          >
            <Icon name={following ? 'user-check' : 'user-plus'} />
            {busy ? 'Memproses…' : following ? 'Mengikuti' : 'Ikuti'}
          </button>
          {href && (
            <a className="ui-btn ui-btn-ghost ps2-btn-sm" href={href}>
              Lihat profil
            </a>
          )}
        </div>
      </div>
    </li>
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
  const href = profilHref(p.slug);
  const body = (
    <>
      <PersonAvatar person={p} size={44} />
      <span>
        <b>
          {p.fullName}
          {p.isVerified && <Icon name="verified" title="Terverifikasi" />}
        </b>
        <small>
          {p.headline || 'Anggota Catalyst Society'} · {STAGE_INFO[p.journeyStage]?.name}
        </small>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a className="ps2-person" href={href}>
          {body}
        </a>
      ) : (
        <div className="ps2-person">{body}</div>
      )}
      <button
        type="button"
        className={`ui-btn ps2-btn-sm ${following ? 'ui-btn-ghost' : 'ui-btn-primary'}`}
        onClick={onToggle}
        disabled={disabled}
        aria-busy={busy || undefined}
        aria-label={`${following ? 'Batal ikuti' : 'Ikuti balik'} ${p.fullName}`}
      >
        {busy ? 'Memproses…' : following ? 'Mengikuti' : 'Ikuti balik'}
      </button>
    </li>
  );
}

'use client';

/* ===========================================================
   Potongan bersama untuk enam halaman Passport: pemuatan data,
   keadaan memuat, galat, kosong, dan format tanggal.
   =========================================================== */
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { ProfileSummary } from '@/lib/types';
import { avatarSrc, initials } from '@/lib/url';

export function errMsg(e: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

interface LoadState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Memuat data sekali per `load`. `load` wajib stabil (useCallback),
 * karena setiap identitas baru berarti permintaan baru. null berarti
 * belum siap, misalnya sesi belum selesai dimuat.
 */
export function useLoad<T>(load: (() => Promise<T>) | null) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!load) return;
    // Jawaban yang datang sesudah komponen dilepas atau sesudah
    // permintaan yang lebih baru dibuang, supaya tidak menimpa data baru.
    let alive = true;
    load().then(
      (data) => {
        if (alive) setState({ data, error: null, loading: false });
      },
      (e: unknown) => {
        if (alive) setState({ data: null, error: errMsg(e, 'Gagal memuat data.'), loading: false });
      },
    );
    return () => {
      alive = false;
    };
  }, [load, nonce]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null, loading: true }));
    setNonce((n) => n + 1);
  }, []);

  const update = useCallback((fn: (d: T) => T) => {
    setState((s) => (s.data === null ? s : { ...s, data: fn(s.data) }));
  }, []);

  return { ...state, retry, update };
}

/**
 * Memindahkan fokus ke elemen ber-id sesudah render berikutnya. Efek
 * anak (penutupan <dialog>) berjalan lebih dulu, jadi fokus di sini
 * tidak direbut kembali oleh dialog yang baru ditutup.
 */
export function useFocusAfterRender() {
  const target = useRef<string | null>(null);
  useEffect(() => {
    const id = target.current;
    if (!id) return;
    target.current = null;
    document.getElementById(id)?.focus();
  });
  return useCallback((id: string) => {
    target.current = id;
  }, []);
}

/* ---------- tampilan ---------- */

export function PageHead({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ps2-head">
      <div>
        <p className="ps2-kicker">Catalyst Passport</p>
        <h1>{title}</h1>
        {lead && <p className="ps2-lead">{lead}</p>}
      </div>
      {children && <div className="ps2-head-act">{children}</div>}
    </header>
  );
}

export function Card({
  id,
  title,
  aside,
  children,
  className,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ps2-card${className ? ` ${className}` : ''}`} aria-labelledby={id}>
      <div className="ps2-card-head">
        {/* tabIndex -1 supaya fokus bisa dipindah ke judul sesudah item terakhir dihapus. */}
        <h2 id={id} tabIndex={-1}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Skeleton({ rows = 3, height = 64, label = 'Memuat…' }: { rows?: number; height?: number; label?: string }) {
  return (
    <div className="ps2-skel" role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="ui-skeleton" style={{ height }} aria-hidden />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="ps2-err" role="alert">
      <p>{message}</p>
      <button type="button" className="ui-btn ui-btn-ghost" onClick={onRetry}>
        Coba lagi
      </button>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <Icon name={icon} />
      <b>{title}</b>
      <p>{children}</p>
      {action}
    </div>
  );
}

/**
 * Kerangka halaman sebelum sesi siap. Galat PassportProvider ditampilkan
 * di sini karena tanpa pengguna tidak ada yang bisa dimuat halaman ini.
 */
export function SessionGate({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading) return <Skeleton rows={3} height={96} label="Memuat Passport…" />;
  return <>{children}</>;
}

/** Foto profil orang lain, atau inisial bila tidak ada. */
export function PersonAvatar({ person, size = 40 }: { person: ProfileSummary; size?: number }) {
  const src = avatarSrc(person);
  if (!src) {
    return (
      <span className="ps2-ava ps2-ava-ini" style={{ width: size, height: size }} aria-hidden>
        {initials(person.fullName)}
      </span>
    );
  }
  return (
    // unoptimized: foto berasal dari data URL demo, bucket Supabase, atau
    // penyedia login, jadi tidak semuanya terdaftar di images.remotePatterns.
    <Image className="ps2-ava" src={src} alt="" width={size} height={size} unoptimized />
  );
}

/* ---------- format ---------- */

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Tanggal YYYY-MM-DD dibaca sebagai tanggal lokal. new Date('2026-01-05')
 * membacanya sebagai tengah malam UTC, yang di zona barat jatuh ke hari
 * sebelumnya.
 */
export function parseDay(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtMonthYear(s: string | null | undefined): string {
  const d = parseDay(s);
  return d ? `${BULAN[d.getMonth()]} ${d.getFullYear()}` : '';
}

export function fmtDate(s: string | null | undefined): string {
  const d = parseDay(s);
  return d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '';
}

export function fmtDayMonth(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

/** "Jan 2026 – Sekarang". Kosong bila kedua tanggal tidak diisi. */
export function fmtRange(start: string | null, end: string | null): string {
  if (start && end) return `${fmtMonthYear(start)} – ${fmtMonthYear(end)}`;
  if (start) return `${fmtMonthYear(start)} – Sekarang`;
  if (end) return `Selesai ${fmtMonthYear(end)}`;
  return '';
}

const ANGKA = new Intl.NumberFormat('id-ID');
export function fmtNumber(n: number): string {
  return ANGKA.format(n);
}

export function fmtPoints(delta: number): string {
  return `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${fmtNumber(Math.abs(delta))}`;
}

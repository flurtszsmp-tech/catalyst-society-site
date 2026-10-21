'use client';

import type { AuthError } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { GoogleLogo, Icon } from '@/components/ui/Icon';
import { getBrowserSupabase } from '@/lib/supabase/client';

export type AuthMode = 'masuk' | 'daftar' | 'lupa';

const JUDUL: Record<AuthMode, { h: string; sub: string; kirim: string }> = {
  masuk: { h: 'Masuk ke akun Anda.', sub: 'Lanjutkan perjalanan Anda di Catalyst Passport.', kirim: 'Masuk' },
  daftar: { h: 'Buat Passport Anda.', sub: 'Satu profil untuk seluruh perjalanan Anda di Catalyst Society.', kirim: 'Daftar' },
  lupa: { h: 'Atur ulang kata sandi.', sub: 'Kami kirim tautan untuk membuat kata sandi baru ke email Anda.', kirim: 'Kirim tautan' },
};

const MIN_SANDI = 8;

type Pesan = { jenis: 'err' | 'ok'; teks: string } | null;

/**
 * Pesan galat Supabase Auth diterjemahkan lewat kodenya. Pesan
 * aslinya tidak ditampilkan mentah, karena sebagian membocorkan
 * apakah sebuah email terdaftar.
 */
function terjemah(e: AuthError): string {
  switch (e.code) {
    case 'invalid_credentials':
      return 'Email atau kata sandi salah.';
    case 'email_not_confirmed':
      return 'Email ini belum dikonfirmasi. Buka tautan yang kami kirim ke kotak masuk Anda.';
    case 'weak_password':
      return `Kata sandi terlalu lemah. Gunakan minimal ${MIN_SANDI} karakter dengan campuran huruf dan angka.`;
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.';
    case 'signup_disabled':
      return 'Pendaftaran sedang ditutup.';
    case 'email_address_invalid':
      return 'Alamat email tidak valid.';
    case 'provider_disabled':
      return 'Login Google belum diaktifkan di Supabase.';
    default:
      return 'Terjadi kesalahan. Coba lagi sebentar lagi.';
  }
}

export function AuthForm({
  initialMode,
  next,
  error,
}: {
  initialMode: AuthMode;
  next: string;
  error: 'callback' | 'confirm' | null;
}) {
  const router = useRouter();
  const id = useId();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [sibuk, setSibuk] = useState<'form' | 'google' | null>(null);
  const [pesan, setPesan] = useState<Pesan>(
    error === 'callback'
      ? { jenis: 'err', teks: 'Tautan masuk tidak valid atau sudah kedaluwarsa. Bila Anda baru mendaftar, email Anda mungkin sudah terverifikasi: silakan masuk.' }
      : error === 'confirm'
        ? { jenis: 'err', teks: 'Tautan konfirmasi tidak valid atau sudah dipakai. Coba masuk, atau minta tautan baru.' }
        : null,
  );

  const j = JUDUL[mode];

  function ganti(m: AuthMode) {
    setMode(m);
    setPesan(null);
    // Mode ikut di alamat supaya tombol kembali dan muat ulang konsisten.
    const u = new URL(window.location.href);
    if (m === 'masuk') u.searchParams.delete('mode');
    else u.searchParams.set('mode', m);
    u.searchParams.delete('error');
    window.history.replaceState(null, '', `${u.pathname}${u.search}`);
  }

  /** Alamat balik ke situs ini, bukan SITE_URL, supaya pratinjau Vercel juga bisa login. */
  function balik(tujuan: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(tujuan)}`;
  }

  async function google() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    setSibuk('google');
    setPesan(null);
    const { error: e } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: balik(next) },
    });
    // Bila berhasil, browser sudah berpindah ke Google.
    if (e) {
      setPesan({ jenis: 'err', teks: terjemah(e) });
      setSibuk(null);
    }
  }

  async function kirim(ev: FormEvent) {
    ev.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) return;

    // Diperiksa sesuai urutan isian di layar.
    const em = email.trim();
    if (mode === 'daftar' && !nama.trim()) {
      setPesan({ jenis: 'err', teks: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setPesan({ jenis: 'err', teks: 'Masukkan alamat email yang valid.' });
      return;
    }
    if (mode !== 'lupa' && sandi.length < (mode === 'daftar' ? MIN_SANDI : 1)) {
      setPesan({ jenis: 'err', teks: mode === 'daftar' ? `Kata sandi minimal ${MIN_SANDI} karakter.` : 'Masukkan kata sandi Anda.' });
      return;
    }

    setSibuk('form');
    setPesan(null);
    try {
      if (mode === 'masuk') {
        const { error: e } = await sb.auth.signInWithPassword({ email: em, password: sandi });
        if (e) throw e;
        router.replace(next);
        router.refresh();
        return;
      }

      if (mode === 'daftar') {
        const { data, error: e } = await sb.auth.signUp({
          email: em,
          password: sandi,
          options: { emailRedirectTo: balik(next), data: { full_name: nama.trim().slice(0, 80) } },
        });
        if (e) throw e;
        if (data.session) {
          // Konfirmasi email dimatikan di Supabase: langsung masuk.
          router.replace(next);
          router.refresh();
          return;
        }
        // Jawaban yang sama untuk email baru maupun yang sudah terdaftar,
        // supaya formulir ini tidak bisa dipakai menebak akun orang.
        setSandi('');
        setPesan({ jenis: 'ok', teks: `Tautan konfirmasi dikirim ke ${em}. Buka email itu untuk mengaktifkan Passport Anda.` });
        return;
      }

      const { error: e } = await sb.auth.resetPasswordForEmail(em, { redirectTo: balik('/passport/settings#password') });
      if (e && e.code !== 'user_not_found') throw e;
      setPesan({ jenis: 'ok', teks: `Bila ${em} terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.` });
    } catch (e) {
      setPesan({ jenis: 'err', teks: e && typeof e === 'object' && 'code' in e ? terjemah(e as AuthError) : 'Tidak bisa terhubung. Periksa koneksi Anda.' });
    } finally {
      setSibuk((s) => (s === 'form' ? null : s));
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-kicker">Catalyst Passport</div>
      <h2>{j.h}</h2>
      <p className="auth-sub">{j.sub}</p>

      {mode !== 'lupa' && (
        <div className="auth-tabs" role="group" aria-label="Pilih masuk atau daftar" data-mode={mode}>
          <button type="button" className={mode === 'masuk' ? 'on' : undefined} aria-pressed={mode === 'masuk'} onClick={() => ganti('masuk')}>
            Masuk
          </button>
          <button type="button" className={mode === 'daftar' ? 'on' : undefined} aria-pressed={mode === 'daftar'} onClick={() => ganti('daftar')}>
            Daftar
          </button>
        </div>
      )}

      {mode !== 'lupa' && (
        <>
          <button type="button" className="auth-google" onClick={() => void google()} disabled={sibuk !== null}>
            <GoogleLogo />
            {sibuk === 'google' ? 'Mengalihkan ke Google…' : mode === 'daftar' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
          </button>
          <div className="auth-or" aria-hidden>
            <span>atau dengan email</span>
          </div>
        </>
      )}

      <form onSubmit={kirim} noValidate>
        {mode === 'daftar' && (
          <div className="auth-field">
            <label htmlFor={`${id}-nama`}>Nama lengkap</label>
            <input id={`${id}-nama`} type="text" autoComplete="name" maxLength={80} value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mode !== 'lupa' && (
          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor={`${id}-sandi`}>Kata sandi</label>
              {mode === 'masuk' && (
                <button type="button" className="auth-link" onClick={() => ganti('lupa')}>
                  Lupa kata sandi?
                </button>
              )}
            </div>
            <div className="auth-pass">
              <input
                id={`${id}-sandi`}
                type={lihat ? 'text' : 'password'}
                autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
                minLength={mode === 'daftar' ? MIN_SANDI : undefined}
                maxLength={72}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                aria-describedby={mode === 'daftar' ? `${id}-hint` : undefined}
                required
              />
              <button type="button" onClick={() => setLihat((v) => !v)} aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={lihat}>
                <Icon name={lihat ? 'eye-off' : 'eye'} />
              </button>
            </div>
            {mode === 'daftar' && (
              <p className="auth-hint" id={`${id}-hint`}>
                Minimal {MIN_SANDI} karakter.
              </p>
            )}
          </div>
        )}

        <button className="auth-submit" type="submit" disabled={sibuk !== null} aria-busy={sibuk === 'form' || undefined}>
          {sibuk === 'form' ? 'Memproses…' : j.kirim}
          <Icon name="arrow" />
        </button>
      </form>

      <div className={`auth-msg${pesan ? ` ${pesan.jenis}` : ''}`} role={pesan?.jenis === 'err' ? 'alert' : 'status'} aria-live="polite">
        {pesan?.teks}
      </div>

      {mode === 'lupa' ? (
        <button type="button" className="auth-back" onClick={() => ganti('masuk')}>
          <Icon name="back" />
          Kembali ke halaman masuk
        </button>
      ) : (
        <Link className="auth-back" href="/">
          <Icon name="back" />
          Kembali ke beranda
        </Link>
      )}
    </div>
  );
}

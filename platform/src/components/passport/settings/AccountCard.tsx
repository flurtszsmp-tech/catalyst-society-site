'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { errorText } from '@/components/passport/profile/hooks';
import { Icon } from '@/components/ui/Icon';
import { FormError, SubmitButton, TextField } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

const METODE: Record<string, string> = {
  google: 'Google',
  email: 'Email dan kata sandi',
  demo: 'Mode demo (tanpa akun)',
};

function PasswordForm({ email }: { email: string | null }) {
  const { repo } = usePassport();
  const toast = useToast();
  const headId = useId();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pw2Err, setPw2Err] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    const a = pw.length < 8 ? 'Kata sandi minimal 8 karakter.' : null;
    const b = !a && pw !== pw2 ? 'Konfirmasi tidak sama dengan kata sandi baru.' : null;
    setPwErr(a);
    setPw2Err(b);
    if (a || b) return;
    setBusy(true);
    try {
      await repo.updatePassword(pw);
      setPw('');
      setPw2('');
      toast('Kata sandi diperbarui.', 'ok');
    } catch (e2) {
      setErr(errorText(e2, 'Gagal mengganti kata sandi. Coba lagi.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pf-form pf-pw" onSubmit={(e) => void kirim(e)} noValidate aria-labelledby={headId}>
      <h3 id={headId}>Ganti kata sandi</h3>
      {/* Membantu pengelola kata sandi mengaitkan sandi baru ke akun yang benar. */}
      <input type="email" name="username" autoComplete="username" value={email ?? ''} readOnly hidden />
      <div className="pf-grid">
        <TextField
          label="Kata sandi baru"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            if (pwErr && e.target.value.length >= 8) setPwErr(null);
          }}
          maxLength={72}
          hint="Minimal 8 karakter."
          error={pwErr}
        />
        <TextField
          label="Ulangi kata sandi baru"
          type="password"
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => {
            setPw2(e.target.value);
            if (pw2Err && e.target.value === pw) setPw2Err(null);
          }}
          maxLength={72}
          error={pw2Err}
        />
      </div>
      <FormError message={err} />
      <div className="pf-btns">
        <SubmitButton busy={busy} disabled={!pw || !pw2}>
          Ganti kata sandi
        </SubmitButton>
      </div>
    </form>
  );
}

export function AccountCard({ profile }: { profile: Profile }) {
  const { user } = usePassport();
  const provider = user?.provider ?? 'email';

  // Tautan "Ganti kata sandi" dari tempat lain mengarah ke #password.
  // Karena konten dirender sesudah profil dimuat, browser tidak sempat
  // menggulir sendiri; di sini digulir dan fokus dipindah ke isian pertama.
  useEffect(() => {
    function tuju() {
      if (location.hash !== '#password') return;
      const box = document.getElementById('password');
      if (!box) return;
      const hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;
      box.scrollIntoView({ block: 'start', behavior: hemat ? 'auto' : 'smooth' });
      const first = box.querySelector<HTMLElement>('input:not([hidden]), button, a[href]');
      (first ?? box).focus({ preventScroll: true });
    }
    tuju();
    window.addEventListener('hashchange', tuju);
    return () => window.removeEventListener('hashchange', tuju);
  }, []);

  return (
    <section className="pf-card" aria-labelledby="pf-akun-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-akun-h">Akun</h2>
          <p>Cara Anda masuk ke Catalyst Passport.</p>
        </div>
      </div>

      <dl className="pf-dl">
        <div>
          <dt>Email</dt>
          <dd>{user?.email ?? 'Tidak ada'}</dd>
        </div>
        <div>
          <dt>Metode masuk</dt>
          <dd>{METODE[provider] ?? provider}</dd>
        </div>
        <div>
          <dt>Catalyst ID</dt>
          <dd>
            <code>{profile.catalystId}</code>
          </dd>
        </div>
      </dl>

      <div id="password" className="pf-sep pf-anchor" tabIndex={-1}>
        {provider === 'email' ? (
          <PasswordForm email={user?.email ?? null} />
        ) : (
          <p className="pf-note">
            <Icon name="shield" />
            <span>
              {provider === 'google'
                ? 'Anda masuk dengan Google, jadi kata sandi dikelola oleh akun Google Anda. Ubah lewat pengaturan keamanan Google.'
                : 'Mode demo tidak memakai kata sandi. Masuk dengan email untuk mengatur kata sandi sendiri.'}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

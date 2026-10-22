'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { errorText } from '@/components/passport/profile/hooks';
import { publicPath } from '@/components/passport/profile/links';
import { FormError, SubmitButton } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { SITE_URL } from '@/lib/env';
import { SLUG_PATTERN } from '@/lib/repo/types';
import type { Profile } from '@/lib/types';

type Hasil = 'tersedia' | 'terpakai' | 'galat';

const HOST = SITE_URL.replace(/^https?:\/\//, '');

/** Alasan spesifik supaya pengguna tahu apa yang harus diperbaiki. */
function formatError(v: string): string | null {
  if (!v) return 'Alamat tidak boleh kosong.';
  if (/[^a-z0-9-]/.test(v)) return 'Hanya huruf kecil, angka, dan tanda hubung (-).';
  if (v.length < 3) return 'Minimal 3 karakter.';
  if (v.length > 40) return 'Maksimal 40 karakter.';
  if (!SLUG_PATTERN.test(v)) return 'Tidak boleh diawali atau diakhiri tanda hubung.';
  return null;
}

export function SlugField({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const id = useId();
  const [v, setV] = useState(profile.slug);
  const [cek, setCek] = useState<{ slug: string; hasil: Hasil } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sama = v === profile.slug;
  const salah = sama ? null : formatError(v);
  const hasil = cek?.slug === v ? cek.hasil : null;
  const bisaSimpan = !sama && !salah && hasil === 'tersedia';

  // Ketersediaan dicek sesudah pengguna berhenti mengetik sebentar, dan
  // hanya jawaban untuk isian terakhir yang dipakai.
  useEffect(() => {
    if (sama || salah) return;
    let batal = false;
    const t = setTimeout(() => {
      repo
        .isSlugAvailable(v)
        .then((ok) => !batal && setCek({ slug: v, hasil: ok ? 'tersedia' : 'terpakai' }))
        .catch(() => !batal && setCek({ slug: v, hasil: 'galat' }));
    }, 450);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [repo, v, sama, salah]);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (!bisaSimpan || busy) return;
    setErr(null);
    setBusy(true);
    try {
      const updated = await repo.updateMyProfile({ slug: v });
      setProfile(updated);
      setV(updated.slug);
      toast('Alamat profil diganti.', 'ok');
    } catch (e2) {
      setErr(errorText(e2, 'Gagal mengganti alamat profil. Coba lagi.'));
    } finally {
      setBusy(false);
    }
  }

  let status: { text: string; kind: 'ok' | 'bad' | 'wait' | 'idle' };
  if (sama) status = { text: 'Ini alamat Anda saat ini.', kind: 'idle' };
  else if (salah) status = { text: salah, kind: 'bad' };
  else if (hasil === 'tersedia') status = { text: 'Tersedia.', kind: 'ok' };
  else if (hasil === 'terpakai') status = { text: 'Sudah dipakai orang lain. Coba variasi lain.', kind: 'bad' };
  else if (hasil === 'galat') status = { text: 'Ketersediaan tidak bisa dicek. Coba lagi sebentar lagi.', kind: 'bad' };
  else status = { text: 'Memeriksa ketersediaan…', kind: 'wait' };

  return (
    <form className="pf-form" onSubmit={(e) => void simpan(e)} noValidate>
      <div className={`ui-field${status.kind === 'bad' ? ' has-error' : ''}`}>
        <label htmlFor={id} className="ui-label">
          Alamat profil kustom
        </label>
        <div className="pf-slug">
          <span className="pf-slug-pre" id={`${id}-pre`}>
            {HOST}/pass/
          </span>
          <input
            id={id}
            className="ui-input"
            value={v}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={status.kind === 'bad' || undefined}
            aria-describedby={`${id}-pre ${id}-st ${id}-warn`}
            onChange={(e) => {
              setErr(null);
              setV(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
          />
        </div>
        <p id={`${id}-st`} className={`pf-status is-${status.kind}`} aria-live="polite">
          {status.text}
        </p>
      </div>

      <p id={`${id}-warn`} className="pf-warn">
        Mengganti alamat membuat tautan lama{' '}
        <a href={publicPath(profile.slug)}>/pass/{profile.slug}</a> berhenti bekerja. Perbarui tautan yang sudah
        Anda bagikan, misalnya di bio media sosial atau CV.
      </p>

      <FormError message={err} />
      <div className="pf-btns">
        <SubmitButton busy={busy} disabled={!bisaSimpan}>
          Simpan alamat
        </SubmitButton>
        {!sama && (
          <button type="button" className="ui-btn ui-btn-ghost" disabled={busy} onClick={() => setV(profile.slug)}>
            Kembalikan
          </button>
        )}
      </div>
    </form>
  );
}

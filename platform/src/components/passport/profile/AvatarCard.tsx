'use client';

import Image from 'next/image';
import { useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { FileButton } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { SUPABASE_URL } from '@/lib/env';
import { assertFile, LIMITS } from '@/lib/repo/types';
import type { Profile } from '@/lib/types';
import { avatarSrc, initials } from '@/lib/url';
import { errorText, useCompletionReward } from './hooks';

/**
 * Hanya host yang terdaftar di images.remotePatterns yang boleh lewat
 * optimasi gambar; host lain membuat next/image melempar galat saat
 * render. data: dan blob: sudah otomatis tidak dioptimasi.
 */
function bisaDioptimasi(src: string): boolean {
  if (!src.startsWith('https://')) return false;
  if (SUPABASE_URL && src.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`)) return true;
  try {
    return new URL(src).hostname === 'lh3.googleusercontent.com';
  } catch {
    return false;
  }
}

export function AvatarCard({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const reward = useCompletionReward();
  const [busy, setBusy] = useState<null | 'upload' | 'remove'>(null);
  const [err, setErr] = useState<string | null>(null);
  // Pratinjau lokal selama unggahan berjalan, supaya pengguna langsung
  // melihat foto yang dipilih walau jaringannya lambat.
  const [preview, setPreview] = useState<string | null>(null);

  const src = preview ?? avatarSrc(profile);

  async function unggah(file: File) {
    setErr(null);
    try {
      assertFile(file, LIMITS.avatarTypes, LIMITS.avatarBytes, 'Foto profil');
    } catch (e) {
      setErr(errorText(e, 'Berkas foto tidak bisa dipakai.'));
      return;
    }
    const lokal = URL.createObjectURL(file);
    setPreview(lokal);
    setBusy('upload');
    try {
      const p = await repo.uploadAvatar(file);
      setProfile(p);
      toast('Foto profil diperbarui.');
      void reward(profile, p);
    } catch (e) {
      setErr(errorText(e, 'Gagal mengunggah foto.'));
    } finally {
      setPreview(null);
      URL.revokeObjectURL(lokal);
      setBusy(null);
    }
  }

  async function hapus() {
    setErr(null);
    setBusy('remove');
    try {
      setProfile(await repo.removeAvatar());
      toast('Foto profil dihapus.');
    } catch (e) {
      setErr(errorText(e, 'Gagal menghapus foto.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="pf-card" aria-labelledby="pf-foto-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-foto-h">Foto profil</h2>
          <p>JPG, PNG, atau WebP, maksimal 2 MB. Foto persegi dengan wajah terlihat jelas paling mudah dikenali.</p>
        </div>
      </div>

      <div className="pf-avatar">
        <div className={`pf-avatar-box${busy === 'upload' ? ' is-busy' : ''}`}>
          {src ? (
            <Image
              src={src}
              alt="Foto profil Anda"
              width={96}
              height={96}
              className="pf-avatar-img"
              unoptimized={!bisaDioptimasi(src)}
            />
          ) : (
            <span className="pf-avatar-img pf-avatar-ini" aria-hidden>
              {initials(profile.fullName)}
            </span>
          )}
        </div>

        <div className="pf-avatar-side">
          <div className="pf-btns">
            <FileButton
              accept={LIMITS.avatarTypes.join(',')}
              onFile={(f) => void unggah(f)}
              disabled={!!busy}
              className="ui-btn ui-btn-primary"
            >
              <Icon name="upload" />
              {profile.avatarPath ? 'Unggah foto baru' : 'Unggah foto'}
            </FileButton>
            {profile.avatarPath && (
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void hapus()} disabled={!!busy}>
                <Icon name="trash" />
                {busy === 'remove' ? 'Menghapus…' : 'Hapus foto'}
              </button>
            )}
          </div>

          <div className="pf-live" aria-live="polite">
            {busy === 'upload' && (
              <span className="pf-progress">
                <span className="pf-bar" aria-hidden>
                  <i />
                </span>
                Mengunggah foto…
              </span>
            )}
          </div>

          {!profile.avatarPath && profile.avatarUrl && !preview && (
            <p className="ui-hint">Saat ini memakai foto dari akun Google Anda. Unggah foto untuk menggantinya.</p>
          )}
          {!src && <p className="ui-hint">Belum ada foto. Inisial nama Anda tampil sebagai gantinya.</p>}
          {err && (
            <p className="ui-error" role="alert">
              {err}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

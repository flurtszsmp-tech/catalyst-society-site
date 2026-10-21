'use client';

import { useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { FileButton, Toggle } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { assertFile, LIMITS } from '@/lib/repo/types';
import type { Profile } from '@/lib/types';
import { safeHref } from '@/lib/url';
import { errorText, useReturnFocus } from './hooks';

/**
 * Tautan CV dari repo: URL bertanda tangan Supabase (https) atau, di
 * mode demo, blob: milik tab ini sendiri. Selain itu ditolak.
 */
function cvHref(u: string | null): string | null {
  if (!u) return null;
  if (u.startsWith(`blob:${location.origin}/`)) return u;
  return safeHref(u);
}

/**
 * Saklar visibilitas CV. Dipakai di halaman Profil dan Settings supaya
 * keduanya membaca dan menulis kolom yang sama dengan cara yang sama.
 */
export function CvVisibilityToggle({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const publik = profile.cvVisibility === 'public';

  async function ubah(v: boolean) {
    setBusy(true);
    try {
      setProfile(await repo.updateMyProfile({ cvVisibility: v ? 'public' : 'private' }));
      toast(v ? 'CV kini tampil di profil publik.' : 'CV kini privat.');
    } catch (e) {
      toast(errorText(e, 'Gagal mengubah visibilitas CV.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Toggle
      label="Tampilkan CV di profil publik"
      checked={publik}
      disabled={busy}
      onChange={(v) => void ubah(v)}
      hint={
        <>
          {publik
            ? 'Aktif: siapa pun yang membuka profil publik Anda bisa melihat dan mengunduh CV.'
            : 'Nonaktif (privat): hanya Anda yang bisa membuka CV ini.'}
          {publik && !profile.isPublic && ' Profil Anda sedang privat, jadi CV tetap tersembunyi dari orang lain.'}
          {!profile.cvFileName && ' Belum ada CV; pengaturan ini berlaku begitu Anda mengunggahnya.'}
        </>
      }
    />
  );
}

export function CvCard({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const fokus = useReturnFocus();
  const [busy, setBusy] = useState<null | 'upload' | 'remove' | 'open'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tanya, setTanya] = useState(false);
  // Bila jendela baru diblokir browser, tautan ditampilkan untuk diklik sendiri.
  const [cadangan, setCadangan] = useState<string | null>(null);
  const demo = repo.mode === 'demo';
  const ada = !!profile.cvFileName;

  async function unggah(file: File) {
    setErr(null);
    setCadangan(null);
    try {
      assertFile(file, LIMITS.cvTypes, LIMITS.cvBytes, 'CV');
    } catch (e) {
      setErr(errorText(e, 'Berkas CV tidak bisa dipakai.'));
      return;
    }
    setBusy('upload');
    try {
      setProfile(await repo.uploadCv(file));
      toast(ada ? 'CV diganti.' : 'CV terunggah.');
    } catch (e) {
      setErr(errorText(e, 'Gagal mengunggah CV.'));
    } finally {
      setBusy(null);
    }
  }

  async function lihat() {
    setErr(null);
    setCadangan(null);
    // Jendela dibuka sekarang, masih di dalam klik, supaya tidak dianggap
    // popup. Alamatnya diisi sesudah tautan bertanda tangan didapat.
    const w = window.open('', '_blank');
    setBusy('open');
    try {
      const url = cvHref(await repo.getCvUrl(profile));
      if (!url) {
        w?.close();
        setErr(
          demo
            ? 'Isi CV mode demo sudah hilang karena halaman dimuat ulang. Unggah lagi untuk melihatnya.'
            : 'CV tidak bisa dibuka saat ini. Coba lagi sebentar lagi.',
        );
        return;
      }
      if (w) {
        w.opener = null;
        w.location.href = url;
      } else {
        setCadangan(url);
      }
    } catch (e) {
      w?.close();
      setErr(errorText(e, 'CV tidak bisa dibuka.'));
    } finally {
      setBusy(null);
    }
  }

  async function hapus() {
    setBusy('remove');
    try {
      setProfile(await repo.removeCv());
      toast('CV dihapus.');
      setTanya(false);
      fokus.restore();
    } catch (e) {
      setTanya(false);
      setErr(errorText(e, 'Gagal menghapus CV.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="pf-card" id="cv" aria-labelledby="pf-cv-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-cv-h">CV / Resume</h2>
          <p>PDF, maksimal 5 MB. Berguna saat melamar peluang lewat Catalyst, tetapi Passport tetap lengkap tanpanya.</p>
        </div>
        <span className="pf-badge">Opsional — tidak wajib</span>
      </div>

      {demo && (
        <p className="pf-note">
          <Icon name="info" />
          <span>
            Mode demo: berkas CV hanya disimpan selama tab ini terbuka. Sesudah halaman dimuat ulang, nama berkasnya
            masih tercatat tetapi isinya perlu diunggah lagi.
          </span>
        </p>
      )}

      {ada ? (
        <div className="pf-file">
          <Icon name="doc" className="pf-file-ico" />
          <div className="pf-file-name">
            <b title={profile.cvFileName ?? undefined}>{profile.cvFileName}</b>
            <span>{profile.cvVisibility === 'public' ? 'Tampil di profil publik' : 'Privat, hanya Anda'}</span>
          </div>
          <div className="pf-btns">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void lihat()} disabled={!!busy}>
              <Icon name="eye" />
              {busy === 'open' ? 'Membuka…' : 'Lihat'}
              <span className="sr-only"> CV (tab baru)</span>
            </button>
            <FileButton accept="application/pdf" onFile={(f) => void unggah(f)} disabled={!!busy}>
              <Icon name="upload" />
              {busy === 'upload' ? 'Mengunggah…' : 'Ganti'}
            </FileButton>
            <button
              type="button"
              className="ui-btn ui-btn-ghost"
              onClick={() => {
                fokus.remember();
                setTanya(true);
              }}
              disabled={!!busy}
            >
              <Icon name="trash" />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div className="pf-file pf-file-empty">
          <Icon name="doc" className="pf-file-ico" />
          <div className="pf-file-name">
            <b>Belum ada CV</b>
            <span>Anda tetap bisa memakai seluruh fitur Passport tanpa CV.</span>
          </div>
          <FileButton accept="application/pdf" onFile={(f) => void unggah(f)} disabled={!!busy}>
            <Icon name="upload" />
            {busy === 'upload' ? 'Mengunggah…' : 'Unggah CV'}
          </FileButton>
        </div>
      )}

      <div className="pf-live" aria-live="polite">
        {busy === 'upload' && (
          <span className="pf-progress">
            <span className="pf-bar" aria-hidden>
              <i />
            </span>
            Mengunggah CV…
          </span>
        )}
      </div>

      {cadangan && (
        <p className="ui-hint">
          Browser memblokir tab baru.{' '}
          <a className="pf-link-open" href={cadangan} target="_blank" rel="noopener noreferrer">
            Buka CV di sini
            <Icon name="arrow" />
          </a>
        </p>
      )}
      {err && (
        <p className="ui-error" role="alert">
          {err}
        </p>
      )}

      <div className="pf-sep">
        <CvVisibilityToggle profile={profile} />
      </div>

      {tanya && (
        <ConfirmDialog
          open
          danger
          title="Hapus CV?"
          message={
            <p>
              Berkas <b>{profile.cvFileName}</b> akan dihapus dari Passport Anda. Anda bisa mengunggah CV lagi kapan saja.
            </p>
          }
          confirmLabel="Hapus CV"
          busy={busy === 'remove'}
          onConfirm={() => void hapus()}
          onCancel={() => {
            setTanya(false);
            fokus.restore();
          }}
        />
      )}
    </section>
  );
}

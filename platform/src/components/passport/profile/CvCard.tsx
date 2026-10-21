'use client';

import { useCallback, useEffect, useState } from 'react';
import { CvViewer } from '@/components/passport/cv/CvViewer';
import { usePassport } from '@/components/passport/PassportProvider';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { FileButton, TextField, Toggle } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { assertFile, LIMITS } from '@/lib/repo/types';
import type { Profile } from '@/lib/types';
import { errorText, useReturnFocus } from './hooks';

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
            ? 'Aktif: siapa pun yang membuka profil publik Anda bisa melihat pratinjau CV.'
            : 'Nonaktif (privat): hanya Anda yang bisa membuka CV ini.'}
          {publik && !profile.isPublic && ' Profil Anda sedang privat, jadi CV tetap tersembunyi dari orang lain.'}
          {!profile.cvFileName && ' Pengaturan ini berlaku untuk PDF yang diunggah maupun tautan CV.'}
        </>
      }
    />
  );
}

export function CvCard({ profile }: { profile: Profile }) {
  const { repo, setProfile } = usePassport();
  const toast = useToast();
  const fokus = useReturnFocus();
  const [busy, setBusy] = useState<null | 'upload' | 'remove' | 'link'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tanya, setTanya] = useState(false);
  const [lihatCv, setLihatCv] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [isianLink, setIsianLink] = useState('');
  const demo = repo.mode === 'demo';
  const ada = !!profile.cvFileName;

  useEffect(() => {
    let hidup = true;
    repo.getCvLink(profile.id).then(
      (u) => {
        if (!hidup) return;
        setLink(u);
        setIsianLink(u ?? '');
      },
      () => {},
    );
    return () => {
      hidup = false;
    };
  }, [repo, profile.id]);

  const muatCv = useCallback(() => repo.getCvUrl(profile), [repo, profile]);

  async function simpanLink(hapus = false) {
    setErr(null);
    setBusy('link');
    try {
      const u = hapus ? null : isianLink.trim() || null;
      await repo.setCvLink(u);
      setLink(u);
      if (hapus) setIsianLink('');
      toast(u ? 'Tautan CV disimpan.' : 'Tautan CV dihapus.');
    } catch (e) {
      setErr(errorText(e, 'Gagal menyimpan tautan CV.'));
    } finally {
      setBusy(null);
    }
  }

  async function unggah(file: File) {
    setErr(null);
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
          <p>Unggah PDF (maksimal 5 MB) atau tautkan CV dari Google Drive. Pengunjung melihat pratinjaunya tanpa mengunduh.</p>
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
            <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setLihatCv(true)} disabled={!!busy}>
              <Icon name="eye" />
              Pratinjau
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

      <div className="pf-sep cv-link">
        <TextField
          label="Tautan CV (opsional)"
          hint={
            link
              ? 'Tautan ini didahulukan di atas PDF yang diunggah. Pastikan akses berbagi Google Drive disetel "Siapa saja yang memiliki link".'
              : 'Contoh: tautan berbagi Google Drive. Setel aksesnya ke "Siapa saja yang memiliki link".'
          }
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/…"
          value={isianLink}
          maxLength={500}
          onChange={(e) => setIsianLink(e.target.value)}
        />
        <div className="pf-btns">
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() => void simpanLink()}
            disabled={!!busy || isianLink.trim() === (link ?? '')}
          >
            {busy === 'link' ? 'Menyimpan…' : 'Simpan tautan'}
          </button>
          {link && (
            <>
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setLihatCv(true)} disabled={!!busy}>
                <Icon name="eye" />
                Pratinjau
              </button>
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void simpanLink(true)} disabled={!!busy}>
                <Icon name="trash" />
                Hapus tautan
              </button>
            </>
          )}
        </div>
      </div>

      {err && (
        <p className="ui-error" role="alert">
          {err}
        </p>
      )}

      <div className="pf-sep">
        <CvVisibilityToggle profile={profile} />
      </div>

      {lihatCv && <CvViewer name={profile.cvFileName ?? profile.fullName} load={muatCv} onClose={() => setLihatCv(false)} />}

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

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { errorText, useReturnFocus } from '@/components/passport/profile/hooks';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/lib/types';

export function DangerCard({ profile }: { profile: Profile }) {
  const { repo, signOut } = usePassport();
  const router = useRouter();
  const toast = useToast();
  const fokus = useReturnFocus();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keluar, setKeluar] = useState(false);
  const [tanya, setTanya] = useState(false);
  const [ketik, setKetik] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const demo = repo.mode === 'demo';
  const cid = profile.catalystId;

  // Modal memanggil showModal() di efeknya sendiri, yang lebih dulu jalan;
  // sesudah itu baru fokus bisa dipindah ke kolom konfirmasi.
  useEffect(() => {
    if (!tanya) return;
    const r = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(r);
  }, [tanya]);

  async function doKeluar() {
    setKeluar(true);
    try {
      await signOut();
    } catch (e) {
      setKeluar(false);
      toast(errorText(e, 'Gagal keluar. Coba lagi.'), 'error');
    }
  }

  function tutup() {
    if (busy) return;
    setTanya(false);
    setKetik('');
    setErr(null);
    fokus.restore();
  }

  async function hapus() {
    if (busy) return;
    // Tombol konfirmasi sudah mati sampai Catalyst ID cocok; pemeriksaan
    // diulang di sini karena Enter di kolom isian juga memanggil hapus().
    if (ketik.trim() !== cid) {
      setErr(`Ketik ${cid} persis seperti tertulis untuk melanjutkan.`);
      inputRef.current?.focus();
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await repo.deleteMyAccount();
      // busy dibiarkan aktif: halaman akan berpindah, jangan sampai tombol bisa ditekan lagi.
      router.replace('/');
      router.refresh();
    } catch (e) {
      setErr(errorText(e, 'Gagal menghapus akun. Coba lagi.'));
      setBusy(false);
    }
  }

  return (
    <section className="pf-card pf-danger" aria-labelledby="pf-bahaya-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-bahaya-h">Zona berbahaya</h2>
          <p>Keluar dari sesi ini atau hapus akun Anda secara permanen.</p>
        </div>
      </div>

      <div className="pf-row">
        <div>
          <p className="ui-label">Keluar</p>
          <p className="ui-hint">Mengakhiri sesi di perangkat ini. Data Anda tetap tersimpan.</p>
        </div>
        <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void doKeluar()} disabled={keluar}>
          <Icon name="out" />
          {keluar ? 'Keluar…' : 'Keluar'}
        </button>
      </div>

      <div className="pf-row pf-sep">
        <div>
          <p className="ui-label">Hapus akun</p>
          <p className="ui-hint">
            {demo
              ? 'Mode demo: seluruh data contoh di browser ini dikembalikan ke awal.'
              : 'Tidak bisa dibatalkan. Profil, foto, CV, sertifikat, projek, poin, dan koneksi Anda dihapus permanen.'}
          </p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn-danger"
          onClick={() => {
            fokus.remember();
            setTanya(true);
          }}
        >
          <Icon name="trash" />
          Hapus akun
        </button>
      </div>

      {tanya && (
        <ConfirmDialog
          open
          danger
          title="Hapus akun secara permanen?"
          confirmLabel="Hapus akun saya"
          busy={busy}
          confirmDisabled={ketik.trim() !== cid}
          onCancel={tutup}
          onConfirm={() => void hapus()}
          message={
            <div className="pf-confirm">
              <p>
                Tindakan ini <b>tidak bisa dibatalkan</b>. Profil Anda beserta foto, CV, sertifikat dan gambarnya,
                projek, CATA points, lencana, dan koneksi akan dihapus. Tautan profil publik Anda juga berhenti bekerja.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void hapus();
                }}
              >
                <label htmlFor={id} className="ui-label">
                  Ketik Catalyst ID Anda, <code>{cid}</code>, untuk mengonfirmasi
                </label>
                <input
                  ref={inputRef}
                  id={id}
                  className="ui-input"
                  value={ketik}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={busy}
                  aria-invalid={!!err || undefined}
                  aria-describedby={err ? `${id}-err` : undefined}
                  onChange={(e) => {
                    setKetik(e.target.value);
                    if (err) setErr(null);
                  }}
                />
              </form>
              {err && (
                <p id={`${id}-err`} className="ui-error" role="alert">
                  {err}
                </p>
              )}
            </div>
          }
        />
      )}
    </section>
  );
}

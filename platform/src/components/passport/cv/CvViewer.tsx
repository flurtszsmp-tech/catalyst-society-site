'use client';

/* ===========================================================
   Pratinjau CV di dalam halaman, tanpa mengunduh.

   Dua sumber: PDF yang diunggah (tautan bertanda tangan Supabase, tanpa
   opsi download sehingga ditampilkan di tempat) atau tautan seperti
   Google Drive, yang diubah ke alamat /preview resminya supaya bisa
   disematkan.
   =========================================================== */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { safeHref } from '@/lib/url';

/** Alamat yang bisa disematkan. Tautan Google Drive/Docs diubah ke mode preview. */
export function embedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname === 'drive.google.com') {
      const m = /\/file\/d\/([^/]+)/.exec(u.pathname);
      const id = m?.[1] ?? u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
    }
    if (u.hostname === 'docs.google.com') {
      const m = /^\/(document|presentation|spreadsheets)\/d\/([^/]+)/.exec(u.pathname);
      if (m) return `https://docs.google.com/${m[1]}/d/${encodeURIComponent(m[2])}/preview`;
    }
  } catch {
    // alamat tidak sah dibiarkan apa adanya; safeHref di pemanggil yang menyaring
  }
  return raw;
}

/** Tautan pratinjau hanya https, atau blob: milik tab ini di mode demo. */
function aman(u: string | null): string | null {
  if (!u) return null;
  if (typeof location !== 'undefined' && u.startsWith(`blob:${location.origin}/`)) return u;
  return safeHref(u);
}

export function CvViewer({ name, load, onClose }: { name: string; load: () => Promise<string | null>; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  // Dimuat sekali saat dibuka; fungsi baru dari render ulang induk tidak
  // boleh menutup lalu membuka dialog lagi.
  const muat = useRef(load);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    let hidup = true;
    muat.current().then(
      (u) => hidup && setUrl(aman(u)),
      () => hidup && setUrl(null),
    );
    return () => {
      hidup = false;
      if (d?.open) d.close();
    };
  }, []);

  const sematan = url ? embedUrl(url) : null;

  return (
    <dialog
      ref={ref}
      className="cvv"
      aria-labelledby="cvv-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="cvv-in">
        <header className="cvv-head">
          <span className="cvv-ico" aria-hidden>
            <Icon name="doc" />
          </span>
          <span className="cvv-title">
            <b id="cvv-title">Curriculum Vitae</b>
            <small>{name}</small>
          </span>
          {url && (
            <a className="ui-btn ui-btn-ghost ps2-btn-sm" href={url} target="_blank" rel="noopener noreferrer">
              <Icon name="external" />
              Buka di tab baru
            </a>
          )}
          <button type="button" className="ui-icon-btn" aria-label="Tutup pratinjau" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="cvv-body">
          {url === undefined ? (
            <div className="cvv-state" role="status">
              <span className="cvv-spin" aria-hidden />
              Menyiapkan pratinjau CV…
            </div>
          ) : !sematan ? (
            <div className="cvv-state" role="alert">
              CV tidak tersedia atau disetel privat oleh pemiliknya.
            </div>
          ) : (
            <iframe className="cvv-frame" src={sematan} title={`Pratinjau CV ${name}`} referrerPolicy="no-referrer" />
          )}
        </div>
      </div>
    </dialog>
  );
}

/**
 * Tombol CV yang menarik: kartu kecil dengan ikon, nama, dan ajakan
 * Pratinjau. Membuka CvViewer, bukan mengunduh berkas.
 */
export function CvPreviewButton({
  name,
  sub,
  load,
  privat = false,
}: {
  name: string;
  sub: string;
  load: () => Promise<string | null>;
  privat?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button type="button" className="cvb" onClick={() => setBuka(true)}>
        <span className="cvb-ico" aria-hidden>
          <Icon name="doc" />
        </span>
        <span className="cvb-txt">
          <b>
            Lihat CV
            {privat && <em>privat</em>}
          </b>
          <small>{sub}</small>
        </span>
        <span className="cvb-go" aria-hidden>
          <Icon name="eye" />
        </span>
      </button>
      {buka && <CvViewer name={name} load={load} onClose={() => setBuka(false)} />}
    </>
  );
}

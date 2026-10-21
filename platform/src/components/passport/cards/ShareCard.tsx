'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CopyButton } from './CopyButton';
import { QrCode } from './QrCode';

export const SHARE_CARD_ID = 'pass-share-card';
export const SHARE_FIELD_ID = 'pass-share-url';

/** Kartu "Share Your Profile": tautan, salin, LinkedIn, X, dan kode QR lokal. */
export function ShareCard({ url, name }: { url: string; name: string }) {
  const kolom = useRef<HTMLInputElement>(null);
  const [qr, setQr] = useState(false);
  const judul = `${name} — Catalyst Society`;

  return (
    <section className="pass-card" id={SHARE_CARD_ID} aria-labelledby="pass-share-h">
      <h2 id="pass-share-h">Share Your Profile</h2>
      <p className="pass-share-sub">Satu profil untuk semuanya. Bagikan sekali, terhubung di mana saja.</p>
      <div className="pass-url">
        <input
          ref={kolom}
          id={SHARE_FIELD_ID}
          value={url}
          readOnly
          aria-label="Tautan profil"
          onFocus={(e) => e.currentTarget.select()}
        />
        <CopyButton text={url} label="Salin tautan profil" done="Tautan profil tersalin" field={kolom} />
      </div>
      <div className="pass-share-row">
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Bagikan ke LinkedIn"
        >
          <Icon name="linkedin" />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(judul)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Bagikan ke X"
        >
          <Icon name="x" />
        </a>
        <CopyButton text={url} label="Salin tautan" done="Tautan profil tersalin" field={kolom}>
          <Icon name="link" />
        </CopyButton>
        <button type="button" aria-label="Tampilkan kode QR" aria-expanded={qr} onClick={() => setQr((q) => !q)}>
          <Icon name="qr" />
        </button>
      </div>
      {qr && (
        <div className="pass-qr">
          <QrCode text={url} />
        </div>
      )}
    </section>
  );
}

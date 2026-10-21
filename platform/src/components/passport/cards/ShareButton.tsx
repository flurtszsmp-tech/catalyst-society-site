'use client';

import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { copyShortcut, copyText } from './copy';
import { SHARE_CARD_ID, SHARE_FIELD_ID } from './ShareCard';

/**
 * Tombol bagikan di kartu hero. Di ponsel memakai lembar bagikan bawaan
 * perangkat; di layar lain menggulir ke kartu Share dan menyalin
 * tautannya sekaligus, seperti dasbor lama.
 */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const toast = useToast();

  async function klik() {
    const sentuh = matchMedia('(pointer: coarse)').matches;
    if (sentuh && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // Dibatalkan pengguna bukan kegagalan; selain itu turun ke salin.
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }

    const hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(SHARE_CARD_ID)?.scrollIntoView({ behavior: hemat ? 'auto' : 'smooth', block: 'center' });
    const kolom = document.getElementById(SHARE_FIELD_ID);
    const r = await copyText(url, kolom instanceof HTMLInputElement ? kolom : null);
    if (r === 'ok') toast('Tautan profil tersalin', 'ok');
    else if (r === 'manual') toast(`Tautan sudah disorot. Tekan ${copyShortcut()} untuk menyalin.`, 'info');
    else toast('Tidak bisa menyalin otomatis. Salin manual dari kartu Share.', 'error');
  }

  return (
    <button type="button" className="pass-share" aria-label="Bagikan profil" onClick={klik}>
      <Icon name="share" />
    </button>
  );
}

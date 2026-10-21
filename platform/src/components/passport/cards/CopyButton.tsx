'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { copyShortcut, copyText } from './copy';

interface Props {
  text: string;
  /** Nama tombol untuk pembaca layar, misalnya "Salin Catalyst ID". */
  label: string;
  /** Kabar sesudah berhasil. */
  done?: string;
  /** Kolom berisi teks yang sama, disorot bila penyalinan otomatis gagal. */
  field?: RefObject<HTMLInputElement | null>;
  className?: string;
  children?: ReactNode;
}

export function CopyButton({ text, label, done = 'Tersalin', field, className, children }: Props) {
  const toast = useToast();
  const [ok, setOk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function klik() {
    const r = await copyText(text, field?.current);
    if (r === 'ok') {
      toast(done, 'ok');
      setOk(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOk(false), 1800);
    } else if (r === 'manual') {
      toast(`Tautan sudah disorot. Tekan ${copyShortcut()} untuk menyalin.`, 'info');
    } else {
      toast('Tidak bisa menyalin otomatis. Salin manual dari kolom tautan.', 'error');
    }
  }

  return (
    <button type="button" className={className} aria-label={label} onClick={klik}>
      {ok ? <Icon name="check" /> : (children ?? <Icon name="copy" />)}
    </button>
  );
}

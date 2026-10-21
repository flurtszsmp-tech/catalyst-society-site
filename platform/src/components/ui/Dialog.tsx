'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Lebar maksimal dalam px. */
  width?: number;
  /**
   * false selama penyimpanan berjalan: tombol X, Escape, dan klik latar
   * tidak menutup, supaya galat penyimpanan tidak hilang bersama formulirnya.
   */
  dismissible?: boolean;
}

/**
 * Jendela modal di atas <dialog> bawaan browser: fokus terkunci di
 * dalam, Escape menutup, dan konten di belakang tidak bisa dijangkau
 * pembaca layar, tanpa pustaka tambahan.
 *
 * Fokus awal: tandai kontrolnya dengan data-autofocus, bukan autoFocus.
 * React menjalankan autoFocus sebelum showModal(), saat dialog masih
 * tertutup, sehingga tidak berpengaruh.
 */
export function Modal({ open, onClose, title, children, width = 520, dismissible = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // Klik latar hanya dihitung bila tekanan juga dimulai di latar. Tanpa
  // ini, memilih teks lalu melepas tombol di luar kotak menutup dialog.
  const tekanDiLatar = useRef(false);
  // Id unik per dialog, supaya dua modal di satu halaman tidak berbagi judul.
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const tutup = () => {
    if (dismissible) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="ui-modal"
      style={{ maxWidth: width }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        tutup();
      }}
      onPointerDown={(e) => {
        tekanDiLatar.current = e.target === ref.current;
      }}
      onClick={(e) => {
        // Klik di luar kotak (di latar dialog) menutup.
        if (e.target === ref.current && tekanDiLatar.current) tutup();
        tekanDiLatar.current = false;
      }}
    >
      <div className="ui-modal-in">
        <header className="ui-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="ui-icon-btn" aria-label="Tutup" onClick={tutup} disabled={!dismissible}>
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  /** Tombol konfirmasi mati, misalnya sampai pengguna mengetik kode konfirmasi. */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Konfirmasi sebelum tindakan yang tidak bisa dibatalkan. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  danger,
  busy,
  confirmDisabled,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={440} dismissible={!busy}>
      <div className="ui-confirm-msg">{message}</div>
      <div className="ui-actions">
        {/* Untuk tindakan berbahaya fokus awal jatuh ke Batal, supaya
            Enter yang tidak disengaja tidak langsung menghapus. */}
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onCancel} disabled={busy} data-autofocus={danger || undefined}>
          Batal
        </button>
        <button
          type="button"
          className={`ui-btn ${danger ? 'ui-btn-danger' : 'ui-btn-primary'}`}
          onClick={onConfirm}
          disabled={busy || confirmDisabled}
          data-autofocus={!danger || undefined}
        >
          {busy ? 'Memproses…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

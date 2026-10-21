'use client';

export type CopyResult = 'ok' | 'manual' | 'fail';

/**
 * Menyalin punya tiga lapis, karena tidak satu pun berlaku di semua
 * keadaan:
 *   1. Clipboard API. Butuh konteks aman dan dokumen yang sedang fokus.
 *   2. execCommand('copy') lewat textarea sementara. Usang, tetapi masih
 *      jalan di konteks tidak aman.
 *   3. Bila keduanya gagal, teks disorot di kolom yang terlihat supaya
 *      pengguna bisa menyalin sendiri. Jalan keluar lebih berguna
 *      daripada sekadar kabar gagal.
 */
export async function copyText(text: string, field?: HTMLInputElement | null): Promise<CopyResult> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return 'ok';
    } catch {
      // Jendela tidak fokus atau izin ditolak; turun ke lapis kedua.
    }
  }

  const aktif = document.activeElement as HTMLElement | null;
  const t = document.createElement('textarea');
  t.value = text;
  t.setAttribute('readonly', '');
  t.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(t);
  t.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  t.remove();

  if (ok) {
    // Textarea sementara mencuri fokus; kembalikan ke tombol asal.
    aktif?.focus();
    return 'ok';
  }
  if (field) {
    field.focus();
    field.select();
    return 'manual';
  }
  aktif?.focus();
  return 'fail';
}

/** Pintasan salin sesuai perangkat, untuk pesan lapis ketiga. */
export function copyShortcut(): string {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘+C' : 'Ctrl+C';
}

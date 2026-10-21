'use client';

import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

type Hasil = { d: string; n: number } | { error: string };

const TEPI = 2; // zona sunyi dalam modul; pemindai butuh tepi putih di sekeliling kode

/**
 * Matriks QR digambar sebagai <path> React, bukan lewat createSvgTag()
 * yang menghasilkan string HTML: isi yang berasal dari data tidak boleh
 * masuk ke dangerouslySetInnerHTML. Hasil gambarnya sama.
 */
function buat(teks: string): Hasil {
  let galat = '';
  // Tingkat koreksi M dicoba dulu; L memuat lebih banyak karakter untuk URL panjang.
  for (const tingkat of ['M', 'L'] as const) {
    try {
      // Satu instans hanya bisa dipakai sekali, jadi selalu dibuat baru.
      const q = qrcode(0, tingkat);
      q.addData(teks);
      q.make();
      const jumlah = q.getModuleCount();
      let d = '';
      for (let r = 0; r < jumlah; r++) {
        let c = 0;
        while (c < jumlah) {
          if (!q.isDark(r, c)) {
            c++;
            continue;
          }
          // Modul gelap yang berderet digabung jadi satu persegi panjang.
          const mulai = c;
          while (c < jumlah && q.isDark(r, c)) c++;
          d += `M${mulai + TEPI} ${r + TEPI}h${c - mulai}v1h-${c - mulai}z`;
        }
      }
      return { d, n: jumlah + TEPI * 2 };
    } catch (e) {
      // Pustaka ini melempar string biasa, bukan Error.
      galat = String(e);
    }
  }
  return { error: galat };
}

export function QrCode({ text, size = 150 }: { text: string; size?: number }) {
  const hasil = useMemo(() => buat(text), [text]);

  if ('error' in hasil) {
    return (
      <p className="pass-qr-note" role="alert">
        Kode QR gagal dibuat: {hasil.error}
      </p>
    );
  }

  return (
    <>
      {/* Ukuran kotak wajib pasti; SVG tanpa width/height jatuh ke 300x150 dan kodenya melar. */}
      <div className="pass-qr-box" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${hasil.n} ${hasil.n}`} width={size} height={size} role="img" aria-label="Kode QR tautan profil" shapeRendering="crispEdges">
          <rect width={hasil.n} height={hasil.n} fill="#fff" />
          <path d={hasil.d} fill="#000" />
        </svg>
      </div>
      <p className="pass-qr-note">Pindai untuk membuka profil ini.</p>
    </>
  );
}

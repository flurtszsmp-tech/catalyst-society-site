# catalystsociety.id

Seluruh kode website Catalyst Society: landing page, platform Passport, backend Supabase, dan CS AI. Live di https://catalystsociety.id (GitHub Pages, branch `gh-pages`).

## Isi repo

| Folder atau file | Isi |
|---|---|
| `index.html`, `login.html`, `app.html`, `assets/` | Landing page (HTML, CSS, JS biasa) dan halaman masuk |
| `assets/cs/` | Tombol dan panel CS AI Tanya Catalyst, serta `pengetahuan.md` (isi yang dijawab AI) |
| `bp/` | Hasil build Passport yang diterbitkan di catalystsociety.id/bp |
| `platform/` | Kode sumber Passport (Next.js, dari repo Bagas, sudah diubah untuk ekspor statis) |
| `platform/supabase/` | Backend: migrasi database `0001_init.sql` dan tes RLS |
| `cs-ai/` | Cloudflare Worker CS AI (`worker.js`), panduan, uji otomatis, alternatif n8n |
| `scripts/build.mjs` | Memadatkan landing ke `dist/` untuk diterbitkan |
| `scripts/salin-passport.py` | Menyalin `platform/out` ke `bp/` dan memasang penjaga sesi |
| `arsip/` | Platform lama dan berkas deploy lama, tidak dipakai lagi |
| `SUPABASE.md` | Cara menyambungkan Supabase |

## Build dan deploy landing

```bash
npm ci
npm run build
```

Isi `dist/` diterbitkan ke branch `gh-pages` (berkas `CNAME` dan `.nojekyll` wajib ada di akar branch itu).

## Build Passport

```bash
cd platform
npm ci
npx next build
cd ..
python scripts/salin-passport.py
```

Lalu build dan deploy landing seperti di atas.

## CS AI

Lihat `cs-ai/PANDUAN.md`. Deploy Worker: `npx wrangler@4 deploy` di folder `cs-ai` (perlu login akun Cloudflare pemilik Worker). Kunci Gemini disimpan sebagai variabel di dashboard Worker, tidak pernah di repo.

## Akun demo

Selama Supabase belum tersambung, Passport berjalan dalam mode demo dengan akun contoh yang tertulis di `assets/catalyst.js`. Hapus tampilan akun demo setelah Supabase aktif.

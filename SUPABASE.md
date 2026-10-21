# Menyambungkan Supabase

Status: **sudah tersambung**. Akun dan data tersimpan di Supabase, bukan lagi
di browser. Rincian project yang dipakai dan apa yang masih perlu diatur dari
Dashboard ada di bagian [Status sekarang](#status-sekarang) di bawah.

## 1. Siapkan project Supabase (pemilik langganan)

1. Buka https://supabase.com, pilih organisasi Catalyst, klik **New project**. Nama `catalyst-society`, region **Southeast Asia (Singapore)**. Simpan password database sendiri, jangan dibagikan.
2. **SQL Editor**: tempel isi `platform/supabase/migrations/0001_init.sql`, klik **Run**. Ini membuat 11 tabel, aturan RLS, dan bucket penyimpanan (foto profil, CV, sertifikat).
3. **Authentication > Sign In / Providers**: aktifkan **Email**.
4. **Authentication > URL Configuration**: Site URL `https://catalystsociety.id`, Redirect URLs tambahkan `https://catalystsociety.id/**`.
5. **Project Settings > API Keys**: salin **Project URL** dan **anon (publishable) key**. Keduanya memang aman ditaruh di website. Jangan pernah memakai atau membagikan **service_role / secret key** dan password database.

## 2. Isi kunci di kode

Landing (halaman masuk), `assets/catalyst.js`:

```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_ANON_KEY: 'isi anon key',
```

Passport, buat berkas `platform/.env.local` (jangan di-commit, sudah diabaikan `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi anon key
NEXT_PUBLIC_SITE_URL=https://catalystsociety.id
```

## 3. Build ulang dan deploy

```bash
cd platform && npm ci && npx next build && cd ..
python scripts/salin-passport.py
npm ci && npm run build
```

Terbitkan `dist/` ke branch `gh-pages`.

## 4. Yang wajib dites setelah tersambung

1. Daftar akun baru dari catalystsociety.id/login.html, cek email konfirmasi.
2. Masuk, pastikan langsung ke /bp/passport/ dan profil tersimpan setelah halaman dimuat ulang.
3. Unggah foto profil dan CV.
4. Keluar, pastikan /bp/passport/ melempar kembali ke halaman masuk.
5. Profil publik catalystsociety.id/bp/p/?u=SLUG terbuka untuk tamu bila profil disetel publik.
6. Hapus tampilan akun demo di halaman masuk.

Catatan: Passport diterbitkan sebagai halaman statis (tanpa server), jadi pemeriksaan sesi dilakukan di browser; keamanan data dijaga RLS di database.


---

## Status sekarang

| Keterangan | Nilai |
|---|---|
| Project ref | `ydhoxefcntwayjkslzje` |
| API URL | https://ydhoxefcntwayjkslzje.supabase.co |
| Region | Singapore (ap-southeast-1) |
| Skema | `platform/supabase/migrations/0001_init.sql` sudah dijalankan |

Kunci `anon` memang tampil di sumber halaman. Yang menjaga data bukan
kerahasiaan kunci itu, melainkan Row Level Security di database. Kunci
`service_role` tidak dipakai di repo ini dan tidak boleh masuk ke kode
frontend.

### Satu sumber kredensial

`supabase.config.json` adalah satu-satunya tempat nilai itu ditulis. Setelah
mengubahnya, jalankan:

```bash
node scripts/set-supabase-env.mjs
```

Skrip itu menanam nilai ke `assets/catalyst.js` dan ke `platform/.env.local`,
sehingga halaman masuk dan Passport selalu menunjuk project yang sama.

### Sesi dipakai bersama halaman masuk dan Passport

Passport memakai `createBrowserClient` dari `@supabase/ssr`, yang menyimpan
sesi di cookie. Karena itu `assets/catalyst.js` memakai pustaka dan versi yang
sama, bukan `supabase-js` biasa yang menyimpan sesi di `localStorage`. Kalau
keduanya berbeda, pengguna yang baru masuk akan dilempar kembali ke halaman
masuk saat membuka Passport.

### Yang masih perlu diatur dari Dashboard

Pengaturan Auth tidak bisa diubah lewat berkas di repo ini.

1. **Authentication → Sign In / Providers → Email**: matikan *Confirm email*
   bila pendaftar ingin langsung masuk tanpa menunggu email konfirmasi.
2. **Authentication → URL Configuration**: *Site URL* `https://catalystsociety.id`,
   *Redirect URLs* tambahkan `https://catalystsociety.id/**`.
3. **Project Settings → Authentication → SMTP**: SMTP bawaan hanya mengizinkan
   beberapa email per jam dan tidak untuk produksi. Pasang SMTP sendiri
   (Resend, Postmark, Amazon SES) sebelum membuka pendaftaran luas.
4. **Authentication → Policies → Password**: aktifkan *Leaked password
   protection*.

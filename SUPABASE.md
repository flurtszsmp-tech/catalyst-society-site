# Catalyst Society × Supabase

Catatan singkat cara situs ini tersambung ke Supabase, apa yang sudah jalan,
dan apa yang masih perlu diatur dari Dashboard.

## Project

| Keterangan | Nilai |
|---|---|
| Project ref | `ydhoxefcntwayjkslzje` |
| API URL | https://ydhoxefcntwayjkslzje.supabase.co |
| Region | Singapore (ap-southeast-1) |

Kunci `anon` bersifat publik dan memang tampil di sumber halaman. Yang menjaga
data bukan kerahasiaan kunci itu, melainkan Row Level Security di database.
Kunci `service_role` tidak dipakai di mana pun pada repo ini dan memang tidak
boleh masuk ke kode frontend.

## Sumber kredensial

`supabase.config.json` adalah satu-satunya tempat nilai itu ditulis. Setelah
mengubahnya, jalankan:

```bash
node scripts/set-supabase-env.mjs
```

Skrip tersebut menanam nilai ke dua tempat:

- `assets/catalyst.js` — dipakai `index.html` dan `login.html`.
- `bp/**/index.html` — ekspor Next.js membaca `process.env` saat berjalan di
  browser, jadi nilainya disisipkan sebagai skrip sebaris paling awal di
  `<head>`, sebelum bundel Next dijalankan.

Skrip yang sama juga menukar penjaga sesi bawaan ekspor Next (yang menebak
status masuk dari `localStorage`) dengan pemeriksaan cookie, karena sesi
sebenarnya disimpan di cookie oleh `@supabase/ssr`.

## Sesi dipakai bersama

`login.html` dan aplikasi Passport di `/bp` sama-sama memakai
`createBrowserClient` dari `@supabase/ssr` versi `0.12.7`. Keduanya menulis
cookie `sb-<ref>-auth-token`, sehingga sekali masuk di halaman login, Passport
langsung mengenali penggunanya. Halaman `/bp/login/` hanya pengalih ke
`/login.html` dengan membawa parameter `next`.

## Skema database

`supabase-schema.sql` adalah sumber kebenaran skema dan aman dijalankan ulang.
Isinya:

- **Tabel**: `profiles`, `badges`, `user_badges`, `journey_events`,
  `point_events`, `community_members`, `connections`, `projects`,
  `certificates`, `profile_views`.
- **Storage**: bucket `avatars` dan `certificates` (publik, dibaca lewat URL)
  serta `cvs` (tertutup, hanya lewat signed URL). Berkas selalu masuk ke folder
  bernama id pengguna, dan kebijakan storage menolak unggahan ke folder lain.
- **Akun baru**: trigger `on_auth_user_created` membuat profil lengkap dengan
  Catalyst ID, alamat profil unik, tahap Explorer, lencana First Step, dan 50
  poin CATA.
- **Gamifikasi**: bergabung ke komunitas (+10), menambah projek (+40), dan
  menambah sertifikat (+30) menaikkan poin, lencana, serta tahap Journey
  secara otomatis.
- **RPC**: `record_profile_view(p_slug)` mencatat satu kunjungan per pengunjung
  per hari, dan `delete_my_account()` menghapus akun beserta seluruh datanya.
- **Hak akses**: seluruh fungsi bantu dicabut dari peran `anon` dan
  `authenticated` supaya tidak bisa dipanggil lewat `/rest/v1/rpc`. Tanpa itu,
  siapa pun bisa menaikkan poin akun mana pun.

## Yang masih perlu diatur dari Dashboard

Pengaturan Auth tidak bisa diubah lewat berkas di repo ini.

1. **Authentication → Sign In / Providers → Email**: matikan *Confirm email*
   bila pendaftar ingin langsung masuk tanpa menunggu email konfirmasi.
2. **Authentication → URL Configuration**: isi *Site URL* dengan
   `https://catalystsociety.id` dan tambahkan `https://catalystsociety.id/**`
   ke *Redirect URLs*, supaya tautan atur ulang kata sandi kembali ke domain
   yang benar.
3. **Project Settings → Authentication → SMTP**: SMTP bawaan Supabase hanya
   mengizinkan beberapa email per jam dan tidak untuk produksi. Pasang SMTP
   sendiri (Resend, Postmark, Amazon SES, dan sejenisnya) sebelum membuka
   pendaftaran luas.
4. **Authentication → Policies → Password**: aktifkan *Leaked password
   protection* agar kata sandi yang pernah bocor ditolak.

## Menjalankan secara lokal

```bash
python -m http.server 5173
```

Buka http://localhost:5173. Untuk membangun versi produksi ke `dist/`:

```bash
npm install
npm run build
```

# Menyambungkan Supabase

Status: **sudah tersambung**. Rincian project yang dipakai dan pengaturan
yang masih harus disentuh dari Dashboard ada di [Status sekarang](#status-sekarang).

Sekarang Passport dan halaman masuk berjalan dalam mode demo (data di browser). Setelah langkah ini, akun dan data tersimpan di Supabase.

## 1. Siapkan project Supabase (pemilik langganan)

1. Buka https://supabase.com, pilih organisasi Catalyst, klik **New project**. Nama `catalyst-society`, region **Southeast Asia (Singapore)**. Simpan password database sendiri, jangan dibagikan.
2. **SQL Editor**: tempel isi `platform/supabase/migrations/0001_init.sql`, klik **Run**. Ini membuat 11 tabel, aturan RLS, dan bucket penyimpanan (foto profil, CV, sertifikat).
3. **Authentication > Sign In / Providers**: aktifkan **Email**.
4. **Authentication > URL Configuration**: Site URL `https://catalystsociety.id`, Redirect URLs tambahkan `https://catalystsociety.id/**` dan `https://catalystsociety.id/login.html`. Dua alamat ini dipakai link masuk lewat email dan link atur ulang kata sandi.
5. **Authentication > Emails > SMTP Settings**: pakai email domain sendiri supaya email login tidak dibatasi pengirim bawaan Supabase (jumlahnya sangat kecil per jam). Isi host `smtp.hostinger.com`, port `465`, pengirim `info@catalystsociety.id`, dan kata sandi kotak email itu (diisi sendiri di dashboard, jangan di kode).
6. **Project Settings > API Keys**: salin **Project URL** dan **anon (publishable) key**. Keduanya memang aman ditaruh di website. Jangan pernah memakai atau membagikan **service_role / secret key** dan password database.

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
2. Coba **Lupa kata sandi?**: link di email harus membuka form kata sandi baru, lalu langsung masuk ke Passport.
3. Coba **Masuk lewat link email**: link di email harus langsung masuk ke Passport (hanya untuk email yang sudah terdaftar).
4. Masuk, pastikan langsung ke /bp/passport/ dan profil tersimpan setelah halaman dimuat ulang.
5. Unggah foto profil dan CV.
6. Keluar, pastikan /bp/passport/ melempar kembali ke halaman masuk.
7. Profil publik catalystsociety.id/bp/p/?u=SLUG terbuka untuk tamu bila profil disetel publik.
8. Hapus tampilan akun demo di halaman masuk.

Catatan: Passport diterbitkan sebagai halaman statis (tanpa server), jadi pemeriksaan sesi dilakukan di browser; keamanan data dijaga RLS di database.


---

## Status sekarang

| Keterangan | Nilai |
|---|---|
| Project ref | `ydhoxefcntwayjkslzje` |
| API URL | https://ydhoxefcntwayjkslzje.supabase.co |
| Region | Singapore (ap-southeast-1) |
| Skema | `0001_init.sql`, `0002_journey_v2.sql`, `0003_admin_dan_penyederhanaan.sql` sudah dijalankan |

Kunci `anon` memang tampil di sumber halaman. Yang menjaga data bukan
kerahasiaan kunci itu, melainkan Row Level Security di database. Kunci
`service_role` tidak dipakai di repo ini dan tidak boleh masuk ke kode
frontend.

### Satu sumber kredensial

`supabase.config.json` menyimpan ketiga nilai publik itu. Setelah mengubahnya:

```bash
node scripts/set-supabase-env.mjs
```

Skrip itu menanamnya ke `assets/catalyst.js` dan membuat `platform/.env.local`,
sehingga halaman masuk dan Passport selalu menunjuk project yang sama. Lanjutkan
dengan build ulang seperti pada bagian 3.

### Yang masih perlu diatur dari Dashboard

Pengaturan Auth tidak bisa diubah lewat berkas di repo ini.

1. **Authentication → Sign In / Providers → Email**: matikan *Confirm email*
   bila pendaftar ingin langsung masuk tanpa menunggu email konfirmasi.
2. **Authentication → URL Configuration**: *Site URL* `https://catalystsociety.id`,
   *Redirect URLs* tambahkan `https://catalystsociety.id/**`. Tanpa ini, tautan
   atur ulang kata sandi dan masuk lewat link email tidak kembali ke situs.
3. **Project Settings → Authentication → SMTP**: SMTP bawaan hanya mengizinkan
   beberapa email per jam dan tidak untuk produksi. Saat pengujian, batas ini
   sudah tercapai dan pendaftaran menolak dengan pesan
   `email rate limit exceeded`. Pasang SMTP sendiri (Resend, Postmark, Amazon
   SES) sebelum membuka pendaftaran luas.
4. **Authentication → Policies → Password**: aktifkan *Leaked password
   protection*.

### Catatan perilaku

- Sesi disimpan di `localStorage` dengan kunci bawaan supabase-js, sama di
  halaman masuk dan di Passport, sehingga sekali masuk langsung dikenali
  keduanya.
- Nilai channel di formulir daftar mengikuti skema database (`investments`,
  `ai`, `business`, `builder`, `impact`) dan tersimpan ke profil lewat
  `private.handle_new_user`.
- Tamu yang membuka halaman Passport diarahkan ke `/login.html` dengan
  parameter `next`, lalu dikembalikan ke halaman yang dituju setelah masuk.

## Journey, poin, dan verifikasi (migrasi 0002)

`platform/supabase/migrations/0002_journey_v2.sql` menambahkan:

- **Catalyst ID berurutan**: `CP-00001`, `CP-00002`, dan seterusnya menurut
  urutan daftar, dari sequence `private.catalyst_no_seq`.
- **Tujuh tahap Journey berurutan**: Explorer, Connector (5 komunitas
  terverifikasi dan mengikuti 5 orang), Challenger (sertifikat dan 1 sesi
  bootcamp), Innovator (projek atau komunitas yang pernah dibangun),
  Contributor (Catalyst Finder), Builder (Catalyst Labs), Founder (bisnis
  bervaluasi di atas Rp100 juta). Tahap hanya naik.
- **Poin CATA terpisah dari tahap** dan hanya untuk hal yang sudah diperiksa:
  daftar +10, profil lengkap +20, komunitas terverifikasi +5 (maks. 10),
  projek pertama +15, sertifikat terverifikasi +25 (maks. 10), naik tahap
  +25 sampai +300. Mengikuti orang dan menekan Gabung tidak memberi poin.
- **Verifikasi tim**: keanggotaan komunitas (dengan bukti), sertifikat, dan
  pengajuan tahap (`journey_claims`) menunggu pemeriksaan di halaman
  Passport › Verifikasi.

### Anggota tim pemeriksa

Hanya anggota `private.staff` yang melihat menu Verifikasi dan bisa memanggil
`staff_review_*`. Pemilik (CP-00001) sudah terdaftar. Menambah anggota lain
dari SQL Editor:

```sql
insert into private.staff (user_id)
select id from auth.users where email = 'nama@catalystsociety.id';
```

### Cadangan data lama

Saat 0002 dijalankan, poin, lencana, dan journey lama dihitung ulang dengan
aturan baru. Salinan keadaan sebelumnya ada di `private.backup_v1_*` bila
suatu saat perlu dibandingkan.

### Uji database

```bash
cd platform && npm run test:db
```

Menjalankan uji RLS (0001) dan uji Journey v2 (0001 + 0002 di atas data lama)
di PGlite, tanpa menyentuh project Supabase.

## Admin dan penyederhanaan (migrasi 0003)

- **Admin tunggal: `info@catalystsociety.id`.** Hak admin aktif otomatis saat
  akun itu terdaftar *dan* emailnya terkonfirmasi. Akun admin tidak punya
  Passport. Dashboard ada di `/bp/admin/`; halaman masuk mengarahkan akun ini
  ke sana. Daftarkan akun admin selagi *Confirm email* masih aktif.
- **Komunitas bebas:** tanpa verifikasi dan tanpa poin. Tombol Tambahkan
  langsung membuka grup komunitasnya. Tetap dihitung untuk tahap Connector.
- **Sertifikat** otomatis terverifikasi bila ID kredensial atau tautan bukti
  diisi; tanpa keduanya tampil dengan keterangan "belum terverifikasi".
  Sertifikat tidak memberi poin.
- **Verifikasi tim** hanya untuk pengajuan tahap Journey (bootcamp, Catalyst
  Finder, Catalyst Labs, Founder), diperiksa di dashboard admin.
- **CV** bisa PDF unggahan atau tautan (Google Drive) di tabel `cv_links`;
  dibuka sebagai pratinjau, tidak diunduh.
- **Masukan pengguna** di tabel `feedback`, dikirim dari menu Kirim masukan
  di Passport dan hanya terbaca admin.
- Admin membaca seluruh data aktivitas lewat `admin_users()` dan
  `admin_activity()`; kata sandi dan token akun tidak pernah ikut.

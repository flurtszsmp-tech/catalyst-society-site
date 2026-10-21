# Menyambungkan Supabase

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

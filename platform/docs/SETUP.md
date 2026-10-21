# Menyiapkan Catalyst Society

Aplikasi ini berjalan dalam dua mode.

| Mode | Kapan | Login | Data |
|---|---|---|---|
| **Demo** | variabel Supabase kosong | tidak ada; langsung masuk | contoh, disimpan di browser |
| **Produksi** | variabel Supabase terisi | Google atau email | Supabase, dijaga Row Level Security |

Mode demo bisa langsung dicoba tanpa langkah apa pun di bawah ini.

---

## 1. Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa `.env.local`, aplikasi otomatis masuk mode demo.

> **Catatan keamanan npm.** Berkas `~/.npmrc` di komputer ini mengarah ke
> `http://registry.npmjs.org/` (tanpa TLS). Project ini menimpanya lewat
> `.npmrc` sendiri supaya selalu memakai HTTPS. Sebaiknya perbaiki juga
> berkas global itu:
> `npm config set registry https://registry.npmjs.org/`

---

## 2. Membuat database Supabase

1. Masuk ke akun Supabase **baru** untuk website ini, lalu **New project**.
   Jangan memakai project `catalyst-dashboard`: di sana ada data keuangan
   internal, dan login publik website akan berbagi tabel pengguna dengannya.
2. **SQL Editor → New query**, tempel seluruh isi
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql),
   lalu **Run**. Berkas ini membuat semua tabel, kebijakan keamanan, bucket
   penyimpanan (foto, sertifikat, CV), dan data awal komunitas serta lencana.
3. **Project Settings → API**, salin **Project URL** dan **anon public key**
   (atau *publishable key*).
4. Buat `.env.local` dari contoh:

   ```bash
   cp .env.example .env.local
   ```

   lalu isi:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Kunci *anon* memang aman berada di browser; yang menjaga data adalah RLS.
   **Jangan** pernah menaruh `service_role` key di variabel `NEXT_PUBLIC_`.
   Aplikasi ini tidak membutuhkannya.

5. Jalankan ulang `npm run dev`. Bilah "Mode demo" hilang dan `/passport`
   sekarang meminta login.

---

## 3. Alamat redirect

**Authentication → URL Configuration**

- **Site URL**: alamat situs produksi, misalnya `https://catalystsociety.site`
- **Redirect URLs**: tambahkan
  - `http://localhost:3000/**`
  - `https://catalystsociety.site/**`
  - alamat pratinjau Vercel bila dipakai, misalnya `https://*-catalyst.vercel.app/**`

Tanpa ini, tautan konfirmasi email, reset kata sandi, dan login Google
ditolak Supabase.

---

## 4. Login dengan email

Sudah aktif secara bawaan. Di **Authentication → Providers → Email**,
biarkan **Confirm email** menyala supaya alamat email diverifikasi sebelum
bisa masuk.

Reset kata sandi mengirim tautan ke `/auth/callback`, lalu membuka
**Passport → Settings → Ganti kata sandi**.

### Disarankan: templat email dengan token_hash

Tautan bawaan Supabase memakai alur PKCE, yang hanya berhasil bila email
dibuka di browser yang sama dengan tempat mendaftar. Supaya tautan tetap
bekerja dari ponsel atau aplikasi email lain, ganti templatnya di
**Authentication → Emails → Templates**:

- **Confirm signup**: ganti `{{ .ConfirmationURL }}` menjadi
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/passport`
- **Reset password**: ganti `{{ .ConfirmationURL }}` menjadi
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Route `/auth/confirm` memverifikasi token itu di server lalu membuka
Passport (atau form ganti kata sandi untuk reset).

---

## 5. Login dengan Google

Bagian ini dilakukan di akun Google Anda sendiri. Client Secret adalah
rahasia: tempelkan hanya di dashboard Supabase, jangan di kode atau `.env`.

### Di Google Cloud

1. Buka [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients)
   dan **Create client**, jenis **Web application**.
2. **Authorized JavaScript origins**
   - `http://localhost:3000`
   - `https://catalystsociety.site`
3. **Authorized redirect URIs**: alamat callback project Supabase Anda,
   yang tertera di **Supabase → Authentication → Providers → Google**.
   Bentuknya `https://<project-ref>.supabase.co/auth/v1/callback`.
   *Bukan* alamat situs Anda.
4. **Create**, lalu simpan **Client ID** dan **Client Secret**.
5. [Data Access (Scopes)](https://console.cloud.google.com/auth/scopes):
   pastikan ada `openid`, `.../auth/userinfo.email`, dan
   `.../auth/userinfo.profile`. Tambahkan `openid` secara manual bila belum ada.
6. [Branding](https://console.cloud.google.com/auth/branding): isi nama
   aplikasi dan logo, supaya layar izin menampilkan "Catalyst Society",
   bukan ID project Supabase.

### Di Supabase

**Authentication → Providers → Google** → nyalakan, tempel Client ID dan
Client Secret, **Save**.

Nama dan foto dari Google otomatis mengisi profil baru.

---

## 6. Deploy ke Vercel

1. Import repositori di Vercel. Framework terdeteksi sebagai Next.js.
2. **Settings → Environment Variables**: isi ketiga variabel di atas, dengan
   `NEXT_PUBLIC_SITE_URL` berisi domain produksi.
3. Tambahkan domain produksi ke **Redirect URLs** Supabase (langkah 3) dan
   ke **Authorized JavaScript origins** Google (langkah 5).

`NEXT_PUBLIC_SITE_URL` menentukan tautan berbagi profil dan gambar pratinjau
yang muncul saat profil dibagikan di LinkedIn, WhatsApp, atau X.

---

## 7. Memeriksa database

Skema diuji dengan Postgres di memori (PGlite) beserta tiruan skema `auth`
dan `storage` Supabase, termasuk percobaan serangan (mengubah poin sendiri,
memberi diri lencana, membaca CV privat, menyisipkan tautan `javascript:`):

```bash
npm run test:db
```

Tiruan tidak bisa meniru API Storage dan server Auth Supabase secara utuh.
Bagian yang tidak teruji tercantum di keluaran perintah itu.

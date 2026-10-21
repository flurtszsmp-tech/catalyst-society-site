# Catalyst Society

Situs Catalyst Society dan Catalyst Passport, dibangun dengan Next.js 16
(App Router), React 19, TypeScript, dan Supabase.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa `.env.local`, situs berjalan dalam
**mode demo**: Passport bisa dicoba penuh dan datanya disimpan di browser.

Untuk login Google dan email, ikuti [docs/SETUP.md](docs/SETUP.md).

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm run lint` | ESLint |
| `npm run test:db` | tes RLS dan trigger database (PGlite, tanpa Supabase) |

## Struktur

```
src/app/(site)       beranda dan direktori komunitas
src/app/passport     dasbor Catalyst Passport (butuh login)
src/app/p/[slug]     profil publik yang bisa dibagikan
src/app/login        masuk dan daftar
src/app/auth         callback OAuth, konfirmasi email, keluar
src/components       komponen per area (landing, communities, passport, ui)
src/lib/repo         akses data: Supabase atau demo (localStorage)
supabase/migrations  skema, RLS, dan storage
legacy/              situs statis lama, hanya untuk rujukan
```

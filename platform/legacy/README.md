# Situs statis lama

Versi HTML/CSS/JS sebelum pindah ke Next.js, disimpan hanya untuk rujukan.
Tidak ikut di-build dan tidak di-deploy.

- `index.html`, `communities.html`, `community.html`, `passport.html`,
  `p.html`, `login.html` sudah dipindah ke `src/app/` (alamat lama
  diarahkan ulang oleh `next.config.ts`).
- `app.html` (Finder dan Academy) belum dipindah.
- `supabase-schema.sql` adalah skema lama. **Jangan dijalankan**: skema
  ini membiarkan pengguna mengubah poin, status verifikasi, dan lencana
  sendiri. Pakai `supabase/migrations/0001_init.sql`.
- Gambar yang dipakai situs baru ada di `public/assets/`.

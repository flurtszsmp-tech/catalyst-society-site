# assets/

Berkas statis situs Catalyst Society, dipisah per peran supaya mudah dicari
dan diganti tanpa menyentuh folder lain.

| Folder       | Isi                                                                 |
|--------------|---------------------------------------------------------------------|
| `brand/`     | Logo dan lambang merek: lockup, ikon aplikasi, favicon, logo mitra.  |
| `hero/`      | Gambar dan video untuk bagian hero di paling atas halaman.           |
| `landing/`   | Gambar pendukung bagian-bagian landing page di bawah hero.           |
| `community/` | Materi halaman Community. **Belum aktif — coming soon.**             |
| `events/`    | Foto dan materi acara, termasuk Catalyst Summit.                     |
| `product/`   | Tangkapan layar produk: Passport, Finder, Academy.                   |
| `css/`       | Lembar gaya yang dipisah dari berkas HTML.                           |
| `js/`        | Skrip: kamus bahasa, diagram ekosistem, integrasi Supabase, demo.    |

## Isi saat ini

```
assets/
├── brand/                     (kosong — lockup masih SVG inline di index.html)
├── hero/                      (kosong — hero memakai gradient, belum ada gambar)
├── landing/
│   ├── desk-v2.webp           bagian 01 "Punya Ide. Akses Terbatas?"
│   ├── tone-deboss.webp
│   ├── tone-notebook.webp
│   ├── tone-signage.webp
│   └── tone-team.webp
├── community/                 (kosong — menu Community masih coming soon)
├── events/
│   └── summit.webp            bagian Catalyst Summit
├── product/
│   ├── app-academy.webp       belum dipakai di halaman mana pun
│   ├── app-finder.webp        belum dipakai di halaman mana pun
│   └── app-passport.webp      belum dipakai di halaman mana pun
├── css/
│   └── ecosystem.css
└── js/
    ├── catalyst.js            klien Supabase (app.html, login.html)
    ├── demo.js                data contoh untuk app.html
    ├── ecosystem.js           diagram orbit ekosistem
    └── i18n.js                kamus ID / EN / ZH
```

## Aturan

- Path ditulis relatif dari akar situs, contoh `assets/landing/desk-v2.webp`.
- Gambar memakai format `.webp`.
- Folder kosong ditahan oleh `.gitkeep`; hapus berkas itu begitu ada isi nyata.

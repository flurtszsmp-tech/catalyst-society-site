# Tanya Catalyst: panduan memasang CS AI

Tombol chat "Tanya Catalyst" sudah terpasang di landing, tetapi baru tampil setelah alamat Worker diisi. Isinya dijawab Gemini 2.5 Flash Lite dari file `website/assets/cs/pengetahuan.md`.

## Cara kerja

1. Pengunjung mengetik di tombol chat landing.
2. Pesan dikirim ke Cloudflare Worker (`worker.js` di folder ini). Kunci Gemini hanya disimpan di Worker, tidak pernah sampai ke browser.
3. Worker membaca `pengetahuan.md` dari catalystsociety.id, lalu bertanya ke Gemini dengan aturan: jawab hanya dari pengetahuan, kalau tidak tahu arahkan ke email dan Instagram Catalyst.
4. Pembatasan: 12 pesan per menit per alamat IP, 10 pesan terakhir saja yang dikirim, maksimal 1000 huruf per pesan, dan hanya menerima permintaan dari catalystsociety.id.

## Langkah 1: kunci Gemini (dikerjakan Bagas)

1. Buka https://aistudio.google.com dengan akun Google Catalyst.
2. Pilih Get API key, lalu Create API key.
3. Disarankan: pasang batas anggaran di Google Cloud Billing supaya biaya tidak pernah melewati angka yang disepakati.
4. Kirim kuncinya ke Madani lewat pesan pribadi, jangan lewat grup atau tangkapan layar.

Catatan: di jalur gratis, Google boleh memakai isi percakapan untuk mengembangkan produknya. Kalau tidak diinginkan, aktifkan billing (biayanya kecil, hitungan ribuan rupiah per bulan untuk lalu lintas landing).

## Langkah 2: Cloudflare Worker (dikerjakan Madani)

1. Daftar gratis di https://dash.cloudflare.com.
2. Buka Workers & Pages, pilih Create, lalu Create Worker (mulai dari Hello World).
3. Beri nama `catalyst-cs`, lalu Deploy.
4. Pilih Edit code, hapus seluruh isi, tempel isi `worker.js`, lalu Deploy.
5. Buka Settings, bagian Variables and Secrets, pilih Add. Jenis: Secret. Nama: `GEMINI_API_KEY`. Nilai: kunci dari Bagas. Simpan dan Deploy.
6. Salin alamat Worker, bentuknya `https://catalyst-cs.NAMA-AKUN.workers.dev`, lalu kirim ke Claude. Alamat ini bukan rahasia.

## Langkah 3: menyalakan tombol (dikerjakan Claude)

Alamat Worker diisi di `website/index.html` pada baris `window.CATALYST_CS_URL = '...'`, diuji, lalu dideploy.

## Memperbarui pengetahuan

Ubah `website/assets/cs/pengetahuan.md`, lalu deploy website. Worker membaca ulang paling lambat 10 menit kemudian. Worker tidak perlu diubah.

## Perlu dicek Bagas sebelum tombol dinyalakan

1. Hadiah Best Project Innovation Summit 2027: di kode tertulis Rp100.000.000. Benar?
2. Angka ekosistem: 10.000+ Access People, 300+ Community Partners, 100+ partnership brands, 100+ project atau startup. Masih sesuai?
3. Status akses program: Passport dan Finder gratis; Academy, Labs, Ventures, Summit premium. Benar?
4. Email kontak resmi untuk chat sudah ditetapkan: info@catalystsociety.id (bukan .site).
5. Tanggal dan lokasi Summit 2027 kalau sudah boleh diumumkan.
6. Ada informasi lain yang sering ditanyakan orang (biaya, cara jadi mentor, cara jadi partner)? Tambahkan ke pengetahuan.

## Uji Worker tanpa Cloudflare

`node uji-worker.mjs` di folder ini. Fetch ke website dan Gemini diganti tiruan, jadi tidak butuh kunci.

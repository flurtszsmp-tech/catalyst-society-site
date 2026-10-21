# Template surel Catalyst Society

Empat berkas di folder ini adalah isi surel yang dikirim Supabase. Semuanya memakai
logo Catalyst, tata bahasa formal, dan tautan kontak resmi.

## Cara memasang

1. Buka Supabase, pilih project, masuk **Authentication**, lalu **Emails**.
2. Pilih templat yang hendak diubah, lalu salin seluruh isi berkas di bawah ini ke kotak **Message body**.
3. Isi juga kolom **Subject** sesuai daftar, lalu simpan.

| Templat di Supabase | Berkas | Subjek |
|---|---|---|
| Reset Password | `reset-password.html` | Atur ulang kata sandi Catalyst Society |
| Confirm signup | `confirm-signup.html` | Konfirmasi akun Catalyst Society Anda |
| Magic Link | `magic-link.html` | Tautan masuk Catalyst Society |
| Change Email Address | `change-email.html` | Konfirmasi perubahan alamat surel |

## Catatan

- Logo diambil dari `https://catalystsociety.id/assets/img/apple-touch-icon.png`. Berkas itu
  harus tetap ada di situs, karena surel memuatnya dari sana.
- Tata letaknya memakai tabel dan gaya sebaris, bentuk yang dipahami hampir semua
  aplikasi surel termasuk Outlook.
- `{{ .ConfirmationURL }}` dan `{{ .NewEmail }}` diisi Supabase saat surel dikirim. Jangan diubah.
- Surel dikirim dari alamat yang diatur di **Project Settings > Authentication > SMTP**.
  Selama SMTP sendiri belum dipasang, pengirim bawaan Supabase hanya mengizinkan
  beberapa surel per jam.

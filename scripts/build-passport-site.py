# -*- coding: utf-8 -*-
"""Bangun situs passport.catalystsociety.id dari catalyst-passport/index.html.

Halamannya sama dengan catalystsociety.id/catalyst-passport/, tetapi semua alamat yang
diawali "/" diarahkan ke domain utama (gaya, skrip, gambar, /login, /passport/), karena
repositori subdomain hanya berisi halaman ini. Hasilnya di folder yang diberikan:
    python scripts/build-passport-site.py <folder-tujuan>
lalu folder itu didorong ke https://github.com/dbagasputra/passport.catalystsociety-id
"""
import io, os, re, sys

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TUJUAN = sys.argv[1]
UTAMA = 'https://catalystsociety.id'

s = io.open(os.path.join(AKAR, 'catalyst-passport', 'index.html'), encoding='utf-8').read()
s = re.sub(r'(href|src)="/(?!/)', r'\1="' + UTAMA + '/', s)
s = s.replace('<meta property="og:url" content="https://catalystsociety.id/catalyst-passport/">',
              '<meta property="og:url" content="https://passport.catalystsociety.id/">')
s = s.replace('<link rel="icon"', '<link rel="canonical" href="https://passport.catalystsociety.id/">\n<link rel="icon"', 1)

os.makedirs(TUJUAN, exist_ok=True)
io.open(os.path.join(TUJUAN, 'index.html'), 'w', encoding='utf-8', newline='\n').write(s)
io.open(os.path.join(TUJUAN, '404.html'), 'w', encoding='utf-8', newline='\n').write(
    '<!doctype html><meta charset="utf-8"><title>Catalyst Passport</title>'
    '<script>location.replace("/")</script>')
io.open(os.path.join(TUJUAN, 'CNAME'), 'w', encoding='utf-8', newline='\n').write('passport.catalystsociety.id\n')
io.open(os.path.join(TUJUAN, '.nojekyll'), 'w').close()
io.open(os.path.join(TUJUAN, 'README.md'), 'w', encoding='utf-8', newline='\n').write(
    '# passport.catalystsociety.id\n\nHalaman program Catalyst Passport. Dibangun otomatis dari repositori '
    'catalystsociety.id (`python scripts/build-passport-site.py`); jangan diedit langsung di sini.\n')
print('ok', TUJUAN)

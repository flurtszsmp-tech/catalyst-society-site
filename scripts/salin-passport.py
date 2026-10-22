# -*- coding: utf-8 -*-
"""Salin hasil build Passport (platform/out) ke nx/ lalu pasang penjaga sesi, gulir halus, pengalih komunitas, dan 404.
scripts/build.mjs memasang isi nx/ langsung di akar situs: /passport/, /pass/, /admin/, /_next/.
Jalankan dari akar repo setelah: cd platform && npm ci && npx next build
    python scripts/salin-passport.py
"""
import io, os, glob, shutil
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(AKAR, 'platform', 'out')
os.chdir(AKAR)
for lama in ('bp', 'nx'):
    if os.path.isdir(lama): shutil.rmtree(lama)
shutil.copytree(OUT, 'nx')
# Passport: wajib sudah masuk, tampil utuh
PENJAGA = ('<script>(function(){try{'
  "var m=localStorage.getItem('catalyst-demo-sesi')==='1'||Object.keys(localStorage).some(function(k){return /^sb-.+-auth-token$/.test(k)});"
  "if(!m)location.replace('/login?next='+encodeURIComponent(location.pathname))}catch(e){}})();</script>")
n = 0
for f in glob.glob('nx/passport/**/*.html', recursive=True):
    s = io.open(f, encoding='utf-8').read(); i = s.index('<head>') + 6
    io.open(f, 'w', encoding='utf-8', newline='').write(s[:i] + PENJAGA + s[i:]); n += 1
# Gulir halus (Lenis, sama dengan landing) untuk dasbor Passport dan profil publik.
# Elemen yang bisa digulir sendiri (sidebar panjang, dialog) tetap memakai gulir bawaan.
# Saat pindah halaman di dalam Next, animasi gulir yang sedang jalan dihentikan dulu
# supaya tidak menarik halaman baru kembali ke posisi lama.
LENIS = ('<style>html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}</style>'
  '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>'
  "<script>addEventListener('DOMContentLoaded',function(){if(!window.Lenis)return;"
  "var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;"
  "var l=window.lenis=new Lenis({lerp:rm?.2:.085,prevent:function(n){if(n===document.body)return false;"
  "var o=getComputedStyle(n).overflowY;return(o==='auto'||o==='scroll')&&n.scrollHeight>n.clientHeight}});"
  "(function f(t){l.raf(t);requestAnimationFrame(f)})(performance.now());"
  "var ps=history.pushState;history.pushState=function(){l.reset();return ps.apply(this,arguments)};"
  "addEventListener('popstate',function(){l.reset()})});</script>")
# Asisten di dalam dasbor: widget yang sama dengan landing, tapi ruang 'passport' supaya
# Worker memakai panduan fitur Passport (assets/cs/pengetahuan-passport.md).
# Profil publik tidak memakainya.
CS = ('<link rel="stylesheet" href="/assets/cs/cs.css">'
  "<script>window.CATALYST_CS_URL='https://catalyst-cs.catalystsociety.workers.dev/';"
  "window.CATALYST_CS_RUANG='passport'</script>"
  '<script src="/assets/cs/cs.js" defer></script>')
g = 0
for f in glob.glob('nx/passport/**/*.html', recursive=True) + glob.glob('nx/pass/**/*.html', recursive=True):
    s2 = io.open(f, encoding='utf-8').read(); i = s2.index('</head>')
    tambah = LENIS + (CS if '/passport/' in f.replace(os.sep, '/') else '')
    io.open(f, 'w', encoding='utf-8', newline='').write(s2[:i] + tambah + s2[i:]); g += 1
# Akar situs adalah landing, bukan halaman Next: berkas akar Next tidak dipasang (lihat build.mjs).
# 404 situs: alamat rapi /pass/<slug> diteruskan ke halaman profil, alamat lama /bp/... ke alamat barunya,
# /login/ dan /passport tanpa garis miring ke halaman yang benar. Selain itu, halaman 404 Next tampil.
ALIH = ("<script>(function(){var p=location.pathname,q=location.search,h=location.hash,m;"
  "if(m=/^\\/pass\\/([^\\/]+)\\/?$/.exec(p)){location.replace('/pass/?u='+m[1]+h);return}"
  "if(/^\\/bp\\/p\\/?$/.test(p)){var u=new URLSearchParams(q).get('u');location.replace(u?'/pass/'+encodeURIComponent(u):'/');return}"
  "if(/^\\/bp(\\/|$)/.test(p)){location.replace((p.slice(3)||'/')+q+h);return}"
  "if(/^\\/login\\/?$/.test(p)){location.replace('/login.html'+q+h);return}"
  "})();</script>")
f404 = 'nx/404.html'
s4 = io.open(f404, encoding='utf-8').read(); i4 = s4.index('<head>') + 6
io.open(f404, 'w', encoding='utf-8', newline='').write(s4[:i4] + ALIH + s4[i4:])
# direktori komunitas Bagas tidak dipakai; landing yang jadi direktori
io.open('nx/communities/index.html', 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><title>Komunitas</title>'
  "<script>location.replace('/#community')</script>")
# berkas prefetch Next: salinan bernama titik
k = 0
for akar, dirs, files in os.walk('nx'):
    for d in list(dirs):
        if d.startswith('__next.'):
            for a2, _, fs in os.walk(os.path.join(akar, d)):
                for f in fs:
                    rel = os.path.relpath(os.path.join(a2, f), akar).replace(os.sep, '.')
                    shutil.copyfile(os.path.join(a2, f), os.path.join(akar, rel)); k += 1
for d in os.listdir('nx/assets'):
    if os.path.isdir(os.path.join('nx/assets', d)):
        shutil.copytree(os.path.join('nx/assets', d), os.path.join('assets', d), dirs_exist_ok=True)
# detail komunitas Bagas tidak dipakai: arahkan ke halaman detail di landing (/?k=slug)
for d in glob.glob('nx/communities/*/'):
    slug = os.path.basename(os.path.normpath(d))
    if slug.startswith('__next'): continue
    io.open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(
        '<!doctype html><meta charset="utf-8"><title>Komunitas</title><script>location.replace("/?k=%s")</script>' % slug)
print('passport', n, 'gulir halus', g, 'prefetch', k, 'detail', len(glob.glob('nx/communities/*/index.html')))

# -*- coding: utf-8 -*-
"""Salin hasil build Passport (platform/out) ke bp/ lalu pasang penjaga sesi, gulir halus, dan pengalih komunitas.
Jalankan dari akar repo setelah: cd platform && npm ci && npx next build
    python scripts/salin-passport.py
"""
import io, os, glob, shutil
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(AKAR, 'platform', 'out')
os.chdir(AKAR)
if os.path.isdir('bp'): shutil.rmtree('bp')
shutil.copytree(OUT, 'bp')
# Passport: wajib sudah masuk, tampil utuh
PENJAGA = ('<script>(function(){try{'
  "var m=localStorage.getItem('catalyst-demo-sesi')==='1'||Object.keys(localStorage).some(function(k){return /^sb-.+-auth-token$/.test(k)});"
  "if(!m)location.replace('/login.html')}catch(e){}})();</script>")
n = 0
for f in glob.glob('bp/passport/**/*.html', recursive=True):
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
g = 0
for f in glob.glob('bp/passport/**/*.html', recursive=True) + glob.glob('bp/p/**/*.html', recursive=True):
    s2 = io.open(f, encoding='utf-8').read(); i = s2.index('</head>')
    io.open(f, 'w', encoding='utf-8', newline='').write(s2[:i] + LENIS + s2[i:]); g += 1
# Sign out (mode demo) membuka "/" = /bp/: hapus sesi lalu ke landing
io.open('bp/index.html', 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><title>Catalyst Society</title>'
  "<script>try{localStorage.removeItem('catalyst-demo-sesi')}catch(e){}location.replace('/')</script>")
# direktori komunitas Bagas tidak dipakai; landing yang jadi direktori
io.open('bp/communities/index.html', 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><title>Komunitas</title>'
  "<script>location.replace('/#community')</script>")
# berkas prefetch Next: salinan bernama titik
k = 0
for akar, dirs, files in os.walk('bp'):
    for d in list(dirs):
        if d.startswith('__next.'):
            for a2, _, fs in os.walk(os.path.join(akar, d)):
                for f in fs:
                    rel = os.path.relpath(os.path.join(a2, f), akar).replace(os.sep, '.')
                    shutil.copyfile(os.path.join(a2, f), os.path.join(akar, rel)); k += 1
for d in os.listdir('bp/assets'):
    if os.path.isdir(os.path.join('bp/assets', d)):
        shutil.copytree(os.path.join('bp/assets', d), os.path.join('assets', d), dirs_exist_ok=True)
# detail komunitas Bagas tidak dipakai: arahkan ke halaman detail di landing (/?k=slug)
for d in glob.glob('bp/communities/*/'):
    slug = os.path.basename(os.path.normpath(d))
    if slug.startswith('__next'): continue
    io.open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(
        '<!doctype html><meta charset="utf-8"><title>Komunitas</title><script>location.replace("/?k=%s")</script>' % slug)
print('passport', n, 'gulir halus', g, 'prefetch', k, 'detail', len(glob.glob('bp/communities/*/index.html')))

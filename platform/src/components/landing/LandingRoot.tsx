'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Mode = 'keluar' | 'lewat';
interface Pelacak {
  el: HTMLElement;
  mode: Mode;
  akhir: number;
}

const jepit = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Akar beranda (.lp) dan seluruh gerak dari skrip index.html: reveal,
 * kaca bilah navigasi di atas bagian gelap, kemajuan gulir (--maju),
 * dorongan marquee, kilau kaca, kursor, tombol magnetis, flip sentuh, dan
 * gulir halus ke jangkar.
 *
 * Semua elemen dicari sekali saat pasang. className elemen di bawahnya
 * konstan, jadi kelas yang dipasang di sini (.in, .di-gelap, .on, .hot)
 * tidak ditimpa render ulang, misalnya saat bahasa diganti.
 */
export function LandingRoot({ children }: { children: ReactNode }) {
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = akar.current;
    if (!root) return;
    const $$ = <E extends Element = HTMLElement>(s: string) => Array.from(root.querySelectorAll<E>(s));
    const rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const ac = new AbortController();
    const opsi = { signal: ac.signal };
    const pasif = { signal: ac.signal, passive: true };
    const bingkai = new Set<number>();
    const timer: number[] = [];
    const observer: IntersectionObserver[] = [];
    let hidup = true;
    const minta = (fn: FrameRequestCallback) => {
      const id = requestAnimationFrame((t) => {
        bingkai.delete(id);
        if (hidup) fn(t);
      });
      bingkai.add(id);
    };

    /* ---------- reveal ---------- */
    const sasaran = $$('.rv,.stagger,.eco-stage,.prob-media');
    sasaran.forEach((el) => {
      if (!el.classList.contains('stagger')) return;
      Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)));
    });
    if (!('IntersectionObserver' in window)) {
      sasaran.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(
        (ents) =>
          ents.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            io.unobserve(e.target);
          }),
        { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
      );
      observer.push(io);
      sasaran.forEach((el) => io.observe(el));
      // Jaring pengaman. Ekosistem sengaja dikecualikan: bagian itu hanya
      // muncul saat benar benar dicapai, tidak pernah dari pewaktu.
      timer.push(
        window.setTimeout(() => {
          sasaran.forEach((el) => {
            if (!el.closest('#ecosystem')) el.classList.add('in');
          });
        }, 6000),
      );
    }

    /* ---------- kemajuan gulir per elemen ----------
       Semua pembacaan letak dulu, penulisan menyusul, supaya tata letak
       tidak dihitung ulang berkali kali dalam satu bingkai. */
    const pelacak: Pelacak[] = [];
    const lacak = (sel: string, mode: Mode) =>
      $$(sel).forEach((el) => {
        el.setAttribute('data-maju', mode);
        pelacak.push({ el, mode, akhir: -1 });
      });
    lacak('.hero', 'keluar');
    lacak('.prob-media', 'lewat');
    lacak('.shead', 'lewat');
    lacak('.ind', 'lewat');
    lacak('.summit', 'lewat');

    const perbaruiMaju = () => {
      const tinggi = innerHeight;
      const hasil = pelacak.map(({ el, mode }) => {
        const r = el.getBoundingClientRect();
        // Hero baru meredup sesudah 40 persen tingginya lewat; kalau dari nol,
        // deskripsi di bawahnya sudah pudar padahal masih terbaca di layar pendek.
        if (mode === 'keluar') return jepit((-r.top / Math.max(r.height, 1) - 0.4) / 0.6);
        return jepit((tinggi - r.top) / Math.max(tinggi + r.height, 1));
      });
      pelacak.forEach((p, i) => {
        const n = Math.round((hasil[i] ?? 0) * 1000) / 1000;
        if (n === p.akhir) return;
        p.akhir = n;
        p.el.style.setProperty('--maju', String(n));
      });
    };

    /* ---------- kaca bilah navigasi membalik di atas bagian gelap ----------
       .scrolled diurus SiteNav sendiri; di sini hanya .di-gelap. */
    const nav = root.querySelector<HTMLElement>('.nav');
    const gelap = $$('section.dark');
    const perbaruiGulir = () => {
      if (nav) {
        const garis = nav.getBoundingClientRect().bottom - 12;
        let di = gelap.some((s) => {
          const r = s.getBoundingClientRect();
          return r.top <= garis && r.bottom >= garis;
        });
        // Di tema gelap bilahnya sudah gelap; membalik ke kaca terang malah
        // membuatnya abu.
        if (document.documentElement.classList.contains('dark-theme')) di = false;
        nav.classList.toggle('di-gelap', di);
      }
      perbaruiMaju();
    };

    /* ---------- marquee terdorong laju gulir ----------
       Dorongan ditulis ke properti translate, bukan transform, supaya tidak
       menimpa animasi berjalan milik deretan itu. */
    const marq = root.querySelector<HTMLElement>('.hero-marquee ul');
    let geser = 0;
    let laju = 0;
    let gulirLalu = scrollY;
    const catatLaju = (y: number) => {
      laju = Math.max(-60, Math.min(60, y - gulirLalu));
      gulirLalu = y;
    };
    const putaran = () => {
      perbaruiMaju();
      if (marq) {
        geser += laju * 0.35;
        geser *= 0.9;
        if (Math.abs(geser) < 0.06) geser = 0;
        laju *= 0.82;
        marq.style.translate = `${geser.toFixed(2)}px 0`;
      }
      minta(putaran);
    };
    minta(putaran);

    addEventListener(
      'scroll',
      () => {
        perbaruiGulir();
        catatLaju(scrollY);
      },
      pasif,
    );
    document.addEventListener('tema-berubah', perbaruiGulir, opsi);
    perbaruiGulir();

    /* ---------- gulir halus ke jangkar #... ----------
       Tautan <Link> yang sudah ditangani router (defaultPrevented) dilewati. */
    root.addEventListener(
      'click',
      (ev) => {
        if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        const a = (ev.target as Element | null)?.closest?.('a[href^="#"]');
        const id = a?.getAttribute('href')?.slice(1);
        const t = id ? document.getElementById(id) : null;
        if (!t) return;
        ev.preventDefault();
        scrollTo({ top: t.getBoundingClientRect().top + scrollY - 96, behavior: rm ? 'auto' : 'smooth' });
      },
      opsi,
    );

    /* ---------- kilau kaca, kursor, magnetis: hanya untuk mouse ---------- */
    const dot = root.querySelector<HTMLElement>('.cur');
    const ring = root.querySelector<HTMLElement>('.cur-ring');
    const magnet = $$('.magnetic');
    if (matchMedia('(hover:hover) and (pointer:fine)').matches && !rm) {
      // Pusat kilau spekular tiap .glass mengikuti kursor, ditulis dalam rAF
      // supaya banyak elemen dalam satu bingkai tidak memicu hitung gaya berulang.
      const antre: { el: HTMLElement; x: number; y: number }[] = [];
      let dijadwal = false;
      const pakaiKilau = () => {
        dijadwal = false;
        antre.forEach(({ el, x, y }) => {
          el.style.setProperty('--gx', `${x}%`);
          el.style.setProperty('--gy', `${y}%`);
        });
        antre.length = 0;
      };
      $$('.glass').forEach((g) =>
        g.addEventListener(
          'pointermove',
          (e) => {
            const r = g.getBoundingClientRect();
            antre.push({
              el: g,
              x: Math.round(((e.clientX - r.left) / r.width) * 100),
              y: Math.round(((e.clientY - r.top) / r.height) * 100),
            });
            if (!dijadwal) {
              dijadwal = true;
              minta(pakaiKilau);
            }
          },
          opsi,
        ),
      );

      if (dot && ring) {
        let mx = innerWidth / 2;
        let my = innerHeight / 2;
        let rx = mx;
        let ry = my;
        addEventListener(
          'mousemove',
          (e) => {
            mx = e.clientX;
            my = e.clientY;
            dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
          },
          pasif,
        );
        const ikuti = () => {
          rx += (mx - rx) * 0.16;
          ry += (my - ry) * 0.16;
          ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
          minta(ikuti);
        };
        ikuti();
        $$('a,button,.node,.flip,.ind-card,.glass,.val-cell').forEach((el) => {
          el.addEventListener('mouseenter', () => ring.classList.add('hot'), opsi);
          el.addEventListener('mouseleave', () => ring.classList.remove('hot'), opsi);
        });
        addEventListener(
          'pointerdown',
          () => {
            dot.classList.add('tekan');
            ring.classList.add('tekan');
          },
          opsi,
        );
        ['pointerup', 'pointercancel'].forEach((ev) =>
          addEventListener(
            ev,
            () => {
              dot.classList.remove('tekan');
              ring.classList.remove('tekan');
            },
            opsi,
          ),
        );
      }

      // Sasaran dikejar dengan peredaman, bukan lompat langsung, supaya
      // lepasnya mengayun halus kembali.
      magnet.forEach((el) => {
        let tx = 0;
        let ty = 0;
        let cx = 0;
        let cy = 0;
        let aktif = false;
        let jalan = false;
        const detak = () => {
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;
          el.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
          if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || aktif) minta(detak);
          else {
            jalan = false;
            el.style.transform = '';
          }
        };
        el.addEventListener(
          'pointermove',
          (e) => {
            const r = el.getBoundingClientRect();
            tx = (e.clientX - r.left - r.width / 2) * 0.28;
            ty = (e.clientY - r.top - r.height / 2) * 0.28;
            aktif = true;
            if (!jalan) {
              jalan = true;
              minta(detak);
            }
          },
          opsi,
        );
        el.addEventListener(
          'pointerleave',
          () => {
            tx = 0;
            ty = 0;
            aktif = false;
          },
          opsi,
        );
      });
    }

    /* ---------- flip dengan sentuhan ---------- */
    if (matchMedia('(hover:none)').matches) {
      $$('.flip').forEach((f) => f.addEventListener('click', () => f.classList.toggle('on'), opsi));
    }

    return () => {
      hidup = false;
      ac.abort();
      bingkai.forEach(cancelAnimationFrame);
      bingkai.clear();
      timer.forEach(clearTimeout);
      observer.forEach((o) => o.disconnect());
      nav?.classList.remove('di-gelap');
      if (marq) marq.style.translate = '';
      magnet.forEach((el) => (el.style.transform = ''));
      ring?.classList.remove('hot', 'tekan');
      dot?.classList.remove('tekan');
      pelacak.forEach(({ el }) => {
        el.removeAttribute('data-maju');
        el.style.removeProperty('--maju');
      });
    };
  }, []);

  return (
    <div className="lp" ref={akar}>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { T, useLang } from '@/lib/i18n/provider';
import { BrandMark, Icon } from '@/components/ui/Icon';

const SIMPUL = [
  { c: 'node anda n-anda', ang: 0, ikon: 'users', judul: 'Anda', k: 'node.anda.d', tetap: false },
  { c: 'node n-mentor', ang: 300, ikon: 'users', judul: 'Mentor', k: 'node.mentor.d', tetap: true },
  { c: 'node n-career', ang: 60, ikon: 'briefcase', judul: 'Career & Opportunity', k: 'node.career.d', tetap: true },
  { c: 'node n-comm', ang: 240, ikon: 'network', judul: 'Community', k: 'node.comm.d', tetap: true },
  { c: 'node n-biz', ang: 180, ikon: 'chart', judul: 'Business', k: 'node.biz.d', tetap: true },
  { c: 'node n-cap', ang: 120, ikon: 'capital', judul: 'Capital', k: 'node.cap.d', tetap: true },
];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

/**
 * Panggung orbit ekosistem: port assets/js/ecosystem.js (kemunculan yang
 * digerakkan gulir, satu kali per kunjungan, dengan kabel sirkuit dari hub
 * ke tiap kartu) ditambah bagian panggung dari skrip index.html (jari jari
 * --R, kelas .tampil, putaran --spin, kartu ditekan).
 *
 * .is-enhanced sudah ada sejak render server supaya tinggi bagian tidak
 * melompat saat hidrasi.
 */
export function EcoScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const ukurUlang = useRef<() => void>(() => {});
  const { lang } = useLang();

  // pengganti event 'bahasa-berubah' situs lama
  useEffect(() => ukurUlang.current(), [lang]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = track?.querySelector<HTMLElement>('.eco-stage');
    const hub = stage?.querySelector<HTMLElement>('.eco-hub');
    const orbit = stage?.querySelector<HTMLElement>('.eco-orbit');
    const svg = stage?.querySelector<SVGSVGElement>('.eco-circuits');
    if (!track || !stage || !hub || !orbit || !svg) return;

    const nodes = Array.from(stage.querySelectorAll<HTMLElement>('.node'));
    const faces = nodes.map((n) => n.querySelector<HTMLElement>('.node-in'));
    const wires = Array.from(svg.querySelectorAll<SVGGElement>('g')).map((group) => ({
      group,
      paths: Array.from(group.querySelectorAll<SVGPathElement>('path')),
    }));
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const rm = motion.matches;
    const ac = new AbortController();
    const opsi = { signal: ac.signal };
    const pasif = { signal: ac.signal, passive: true };
    const bingkai = new Set<number>();
    let hidup = true;
    const minta = (fn: FrameRequestCallback) => {
      const id = requestAnimationFrame((t) => {
        bingkai.delete(id);
        if (hidup) fn(t);
      });
      bingkai.add(id);
      return id;
    };

    /* ---------- kemunculan digerakkan gulir (ecosystem.js) ---------- */
    let lastAmounts: number[] = [];
    let lastPaint = -1;
    let lastOrb = -1;
    let highWater = 0;
    let displayed = 0;
    let raf = 0;
    let previousTime = 0;
    let visible = false;
    let dirty = true;
    let geometry: { cx: number; cy: number; x: number; y: number; dx: number; dy: number }[] = [];

    const kurva = (cx: number, cy: number, x: number, y: number) =>
      `M ${cx} ${cy} C ${cx + (x - cx) * 0.45} ${cy} ${x - (x - cx) * 0.14} ${y - (y - cy) * 0.2} ${x} ${y}`;

    function measure() {
      const w = stage!.clientWidth;
      const h = stage!.clientHeight;
      const cx = hub!.offsetLeft;
      const cy = hub!.offsetTop;
      svg!.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // Titik ujung memakai koordinat tata letak yang sama dengan kartu;
      // jalur tidak dibuat ulang acak tiap bingkai, jadi arus tidak melompat.
      geometry = nodes.map((node, i) => {
        const x = node.offsetLeft;
        const y = node.offsetTop;
        const d = kurva(cx, cy, x, y);
        wires[i]?.paths.forEach((p) => p.setAttribute('d', d));
        return { cx, cy, x, y, dx: x - cx, dy: y - cy };
      });
      dirty = false;
      lastPaint = -1;
      lastOrb = -1;
      lastAmounts = [];
    }

    function paint(p: number) {
      if (p === lastPaint) return;
      lastPaint = p;
      const orb = motion.matches ? 1 : ease(p / 0.25);
      if (orb !== lastOrb) {
        hub!.style.opacity = String(orb);
        hub!.style.transform = `translate(-50%,-50%) translateY(${(1 - orb) * 38}px) scale(${0.88 + 0.12 * orb})`;
        orbit!.style.opacity = String(0.45 * orb);
        hub!.classList.toggle('is-settled', orb === 1);
        lastOrb = orb;
      }
      nodes.forEach((node, i) => {
        const amount = motion.matches ? 1 : ease((p - 0.12 - i * 0.095) / 0.32);
        if (lastAmounts[i] === amount) return;
        lastAmounts[i] = amount;
        const g = geometry[i];
        const wire = wires[i];
        if (!g || !wire) return;
        node.style.opacity = String(amount);
        node.style.transform = `translate(-50%,-50%) translate(${-g.dx * 0.15 * (1 - amount)}px,${34 * (1 - amount)}px)`;
        const x = g.x - g.dx * 0.15 * (1 - amount);
        const y = g.y + 34 * (1 - amount);
        const d = kurva(g.cx, g.cy, x, y);
        wire.paths.forEach((path) => path.setAttribute('d', d));
        faces[i]?.style.setProperty('--yaw', `${(i % 2 ? 1 : -1) * (12 + 20 * (1 - amount))}deg`);
        wire.group.style.opacity = String(amount);
        const kabel = wire.paths[0];
        if (kabel) {
          kabel.style.strokeDasharray = '100';
          kabel.style.strokeDashoffset = String(100 * (1 - amount));
        }
        node.classList.toggle('is-settled', amount === 1);
      });
      track!.dataset.revealProgress = p.toFixed(3);
    }

    function tick(time: number) {
      raf = 0;
      if (!dirty && displayed === 1) return;
      if (dirty) measure();
      const rect = track!.getBoundingClientRect();
      const distance = Math.max(280, track!.offsetHeight - stage!.offsetHeight);
      const progress = clamp((innerHeight * 0.52 - rect.top) / distance);
      highWater = motion.matches ? 1 : Math.max(highWater, progress);
      const dt = previousTime ? Math.min(64, time - previousTime) : 16;
      previousTime = time;
      displayed += (highWater - displayed) * (1 - Math.exp(-dt / 65));
      if (Math.abs(highWater - displayed) < 0.0008) displayed = highWater;
      paint(displayed);
      if (Math.abs(highWater - displayed) > 0.0008 && !document.hidden) raf = minta(tick);
    }
    const schedule = () => {
      if (!raf && !document.hidden) raf = minta(tick);
    };
    const kotor = () => {
      dirty = true;
      schedule();
    };
    ukurUlang.current = kotor;

    addEventListener('scroll', () => visible && displayed < 1 && schedule(), pasif);
    addEventListener('resize', kotor, pasif);
    document.addEventListener(
      'visibilitychange',
      () => {
        track.classList.toggle('is-suspended', document.hidden);
        previousTime = 0;
        schedule();
      },
      opsi,
    );
    motion.addEventListener('change', kotor, opsi);
    const ro = new ResizeObserver(kotor);
    ro.observe(stage);
    const ioLihat = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      track.classList.toggle('is-visible', visible);
      if (visible) schedule();
    });
    ioLihat.observe(stage);
    measure();
    paint(motion.matches ? 1 : 0);
    schedule();

    /* ---------- panggung orbit (skrip index.html) ---------- */
    // Jari jari kartu mengikuti lebar panggung.
    let jariLalu = 0;
    const ukurJariJari = () => {
      const w = stage.offsetWidth;
      if (!w) return; // belum ditata, coba lagi nanti
      const r = Math.round(w * 0.37);
      if (r !== jariLalu) {
        jariLalu = r;
        stage.style.setProperty('--R', `${r}px`);
      }
    };
    ukurJariJari();
    minta(ukurJariJari);
    addEventListener('load', ukurJariJari, opsi);
    addEventListener('resize', ukurJariJari, pasif);

    // .tampil dipasang sekali; tanpa itu seluruh diagram tetap transparan
    const ioTampil = new IntersectionObserver(
      (ents) => {
        if (!ents.some((e) => e.isIntersecting)) return;
        ioTampil.disconnect();
        stage.classList.add('tampil');
      },
      { threshold: 0.35 },
    );
    ioTampil.observe(stage);

    // putaran orbit sekitar 360 derajat per 72 detik, berhenti selama kartu ditekan
    if (!rm) {
      let spinDeg = 0;
      let spinLalu = 0;
      const LAJU = 360 / 72;
      const putar = (t: number) => {
        if (jariLalu === 0) ukurJariJari();
        if (!spinLalu) spinLalu = t;
        const dt = Math.min(t - spinLalu, 80);
        spinLalu = t;
        if (!stage.classList.contains('ditahan')) {
          spinDeg = (spinDeg + (LAJU * dt) / 1000) % 360;
          stage.style.setProperty('--spin', `${spinDeg.toFixed(2)}deg`);
        }
        minta(putar);
      };
      minta(putar);
    }

    // kartu ditekan: membesar, putaran berhenti sampai jari atau tombol dilepas
    nodes.forEach((n) =>
      n.addEventListener(
        'pointerdown',
        () => {
          n.classList.add('ditekan');
          stage.classList.add('ditahan');
        },
        opsi,
      ),
    );
    const lepas = () => {
      nodes.forEach((n) => n.classList.remove('ditekan'));
      stage.classList.remove('ditahan');
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => document.addEventListener(ev, lepas, opsi));

    return () => {
      hidup = false;
      ac.abort();
      bingkai.forEach(cancelAnimationFrame);
      bingkai.clear();
      ro.disconnect();
      ioLihat.disconnect();
      ioTampil.disconnect();
      ukurUlang.current = () => {};
      track.classList.remove('is-visible', 'is-suspended');
      lepas();
    };
  }, []);

  return (
    <div className="eco-scroll is-enhanced" ref={trackRef}>
      <div className="eco-scene">
        <div className="eco-stage">
          <svg className="eco-circuits" aria-hidden>
            {SIMPUL.map((s, i) => (
              <g key={s.k}>
                <path className="eco-wire" pathLength={100} style={{ '--i': i } as CSSProperties} />
                <path className="eco-current" pathLength={100} style={{ '--i': i } as CSSProperties} />
              </g>
            ))}
          </svg>
          <div className="eco-rays" />
          <div className="eco-pulse" />
          <div className="eco-pulse eco-pulse-2" />
          <div className="eco-orbit" />
          <div className="eco-hub">
            <div className="eco-orb-in">
              <div className="eco-galaxy" />
              <div className="eco-reflection" />
            </div>
            <BrandMark />
            <span>CATALYST</span>
          </div>

          <div className="eco-ring">
            {SIMPUL.map((s, i) => (
              <div key={s.k} className={s.c} style={{ '--idx': i, '--baseAng': `${s.ang}deg` } as CSSProperties}>
                <div className="node-in">
                  <div className="nh">
                    <Icon name={s.ikon} />
                    <b translate={s.tetap ? 'no' : undefined}>{s.judul}</b>
                  </div>
                  <T as="p" k={s.k} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

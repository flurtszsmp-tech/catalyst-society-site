'use client';

/* ===========================================================
   Ucapan naik tahap Journey.

   Muncul sendiri saat journey_stage berada di depan journey_seen_stage,
   dan bisa dibuka lagi dari kartu Journey untuk tahap yang sudah dilewati.
   Kartunya sengaja dibuat seperti poster: nama, tahap, Catalyst ID, dan
   alamat Catalyst Society, supaya tangkapan layarnya ikut menjadi papan
   iklan saat dibagikan ke media sosial.
   =========================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePassport } from '@/components/passport/PassportProvider';
import { Icon } from '@/components/ui/Icon';
import { ICON_PATHS } from '@/components/ui/icon-paths';
import { useToast } from '@/components/ui/Toast';
import { SITE_URL } from '@/lib/env';
import { STAGE_RULES } from '@/lib/repo/journey-rules';
import { STAGES, type Profile, type Stage } from '@/lib/types';
import { avatarSrc } from '@/lib/url';

interface Ctx {
  /** Membuka kartu untuk tahap yang sudah dilewati. */
  openStage: (s: Stage) => void;
}

const CelebrationContext = createContext<Ctx>({ openStage: () => {} });

export function useCelebration(): Ctx {
  return useContext(CelebrationContext);
}

const rank = (s: Stage) => Math.max(0, STAGES.indexOf(s));

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { repo, profile, setProfile } = usePassport();
  const [manual, setManual] = useState<Stage | null>(null);
  const [ditutup, setDitutup] = useState<Stage | null>(null);

  // Tahap baru yang belum dirayakan. Bila beberapa tahap terlewati sekaligus,
  // yang dirayakan tahap tertinggi.
  const baru =
    profile && rank(profile.journeyStage) > rank(profile.journeySeenStage) && ditutup !== profile.journeyStage
      ? profile.journeyStage
      : null;
  const tampil = manual ?? baru;

  const tutup = useCallback(async () => {
    const sedang = tampil;
    setManual(null);
    if (!profile || !sedang || sedang !== baru) return;
    setDitutup(sedang);
    try {
      await repo.markJourneySeen(sedang);
      setProfile({ ...profile, journeySeenStage: sedang });
    } catch {
      // Gagal menyimpan hanya berarti ucapan muncul lagi lain kali.
    }
  }, [tampil, baru, profile, repo, setProfile]);

  const ctx = useMemo<Ctx>(() => ({ openStage: (s) => setManual(s) }), []);

  return (
    <CelebrationContext.Provider value={ctx}>
      {children}
      {profile && tampil && <CelebrationModal profile={profile} stage={tampil} fresh={tampil === baru && !manual} onClose={() => void tutup()} />}
    </CelebrationContext.Provider>
  );
}

/* ---------- gambar kartu ---------- */

const W = 1080;
const H = 1350;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tanggal(d = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/**
 * Kartu sebagai SVG mandiri. Dipakai dua kali: dirender ke kanvas untuk
 * diunduh sebagai PNG. Huruf memakai font sistem karena SVG yang dimuat
 * sebagai gambar tidak bisa mengambil webfont.
 */
/**
 * Foto profil sebagai data URL, supaya ikut tergambar di PNG: SVG yang dimuat
 * sebagai gambar tidak boleh mengambil berkas dari luar. Gagal (CORS, jaringan)
 * berarti kartu memakai ikon tahap saja.
 */
async function fotoData(src: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image/')) return src;
  try {
    const res = await fetch(src, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise<string | null>((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(typeof fr.result === 'string' ? fr.result : null);
      fr.onerror = () => ok(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Warna tahap untuk gambar PNG, sama dengan src/styles/stages.css. */
const WARNA: Record<Stage, { deep: string; a: string; b: string; lit: string; on: string }> = {
  explorer: { deep: '#2b2b2b', a: '#ffffff', b: '#cfcfd4', lit: '#ffffff', on: '#000000' },
  connector: { deep: '#3a3e46', a: '#fbfbfc', b: '#a3a8b2', lit: '#e4e7ec', on: '#1c1e22' },
  challenger: { deep: '#2c2e33', a: '#8d929b', b: '#33363c', lit: '#a7acb5', on: '#ffffff' },
  innovator: { deep: '#123b2c', a: '#46a07c', b: '#0d3a2b', lit: '#5cc398', on: '#ffffff' },
  contributor: { deep: '#3a2e14', a: '#f7ecc9', b: '#a8853d', lit: '#e5c77d', on: '#2b1f05' },
  builder: { deep: '#14215e', a: '#6c8bff', b: '#142886', lit: '#8ba3ff', on: '#ffffff' },
  founder: { deep: '#2a1352', a: '#c4a6ff', b: '#3b1a78', lit: '#b99bff', on: '#ffffff' },
};

function kartuSvg(p: Profile, stage: Stage, alamat: string, foto: string | null = null): string {
  const w = WARNA[stage];
  const r = STAGE_RULES[stage];
  const i = rank(stage);
  const ikon = ICON_PATHS[`j-${stage}`] ?? '';
  const font = 'Helvetica Neue, Helvetica, Arial, sans-serif';
  const titik = STAGES.map((s, k) => {
    const x = W / 2 - ((STAGES.length - 1) * 74) / 2 + k * 74;
    const isi = k <= i;
    const c = WARNA[s].lit;
    return `<circle cx="${x}" cy="1010" r="${k === i ? 21 : 15}" fill="${isi ? c : 'none'}" stroke="${isi ? c : '#4a4a4a'}" stroke-width="3"/>`;
  }).join('');
  const nama = esc(p.fullName.length > 30 ? `${p.fullName.slice(0, 29)}…` : p.fullName);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="50%" cy="34%" r="62%"><stop offset="0" stop-color="${w.deep}"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${w.a}"/><stop offset="1" stop-color="${w.b}"/></linearGradient>
    <radialGradient id="h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="${W / 2}" cy="470" r="330" fill="url(#h)"/>
  <circle cx="${W / 2}" cy="470" r="250" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
  <circle cx="${W / 2}" cy="470" r="190" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>
  <g transform="translate(86 92) scale(.42)" fill="#fff">
    <path d="M 79.86 -60.18 A 100 100 0 1 0 79.86 60.18 L 49.52 37.31 A 62 62 0 1 1 49.52 -37.31 Z" transform="translate(108 118)"/>
    <path d="M 126.5 -87.7 Q 108.05 -84.22 104.8 -64.5 Q 101.55 -84.22 83.1 -87.7 Q 101.55 -91.18 104.8 -110.9 Q 108.05 -91.18 126.5 -87.7 Z" transform="translate(108 118)"/>
  </g>
  <text x="200" y="128" font-family="${font}" font-size="30" font-weight="700" letter-spacing="5" fill="#fff">CATALYST</text>
  <text x="200" y="160" font-family="${font}" font-size="20" letter-spacing="8" fill="#9a9a9a">PASSPORT</text>
  <text x="${W - 86}" y="140" text-anchor="end" font-family="${font}" font-size="26" letter-spacing="3" fill="#9a9a9a">${esc(p.catalystId)}</text>
  <circle cx="${W / 2}" cy="470" r="128" fill="url(#m)"/>
  ${
    foto
      ? `<clipPath id="f"><circle cx="${W / 2}" cy="470" r="122"/></clipPath>
  <image href="${esc(foto)}" x="${W / 2 - 122}" y="348" width="244" height="244" preserveAspectRatio="xMidYMid slice" clip-path="url(#f)"/>
  <circle cx="${W / 2 + 92}" cy="562" r="48" fill="url(#m)" stroke="#0b0b0b" stroke-width="8"/>
  <g transform="translate(${W / 2 + 92 - 30} ${562 - 30}) scale(2.5)" fill="none" stroke="${w.on}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ikon}</g>`
      : `<g transform="translate(${W / 2 - 96} ${470 - 96}) scale(8)" fill="none" stroke="${w.on}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ikon}</g>`
  }
  <text x="${W / 2}" y="730" text-anchor="middle" font-family="${font}" font-size="30" letter-spacing="10" fill="${w.lit}">JOURNEY UNLOCKED</text>
  <text x="${W / 2}" y="840" text-anchor="middle" font-family="${font}" font-size="118" font-weight="300" fill="#fff">${esc(r.name)}</text>
  <text x="${W / 2}" y="910" text-anchor="middle" font-family="${font}" font-size="32" fill="#c9c9c9">Tahap ${i + 1} dari ${STAGES.length} · ${esc(r.summary)}</text>
  ${titik}
  <line x1="86" y1="1120" x2="${W - 86}" y2="1120" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>
  <text x="86" y="1190" font-family="${font}" font-size="44" fill="#fff">${nama}</text>
  <text x="86" y="1240" font-family="${font}" font-size="26" fill="#9a9a9a">${esc(tanggal())}</text>
  <text x="${W - 86}" y="1190" text-anchor="end" font-family="${font}" font-size="30" fill="#fff">${esc(alamat)}</text>
  <text x="${W - 86}" y="1240" text-anchor="end" font-family="${font}" font-size="24" fill="#9a9a9a">Accelerating Future Builders</text>
</svg>`;
}

async function kartuPng(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((ok, gagal) => {
      img.onload = () => ok();
      img.onerror = () => gagal(new Error('Gambar kartu gagal dibuat.'));
      img.src = url;
    });
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Browser ini tidak bisa membuat gambar.');
    ctx.drawImage(img, 0, 0, W, H);
    return await new Promise<Blob>((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error('Gambar kartu gagal dibuat.'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------- jendela ucapan ---------- */

function CelebrationModal({ profile: p, stage, fresh, onClose }: { profile: Profile; stage: Stage; fresh: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [sibuk, setSibuk] = useState<'unduh' | 'bagi' | null>(null);
  const r = STAGE_RULES[stage];
  const i = rank(stage);
  const origin = SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const profilUrl = `${origin}/pass/${encodeURIComponent(p.slug)}`;
  const alamat = (SITE_URL || 'https://catalystsociety.id').replace(/^https?:\/\//, '');
  const nama = `catalyst-${stage}-${p.slug}.png`;
  const foto = avatarSrc(p);
  const buatPng = async () => kartuPng(kartuSvg(p, stage, alamat, await fotoData(foto)));
  const teks = `Saya baru mencapai tahap ${r.name} di Catalyst Society Journey (${i + 1}/${STAGES.length}). Lihat Catalyst Passport saya:`;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  async function unduh() {
    setSibuk('unduh');
    try {
      const blob = await buatPng();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nama;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal mengunduh gambar.', 'error');
    } finally {
      setSibuk(null);
    }
  }

  async function bagikan() {
    setSibuk('bagi');
    try {
      const blob = await buatPng();
      const file = new File([blob], nama, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${r.name} · Catalyst Society`, text: `${teks} ${profilUrl}` });
      } else if (navigator.share) {
        await navigator.share({ title: `${r.name} · Catalyst Society`, text: teks, url: profilUrl });
      } else {
        await navigator.clipboard.writeText(`${teks} ${profilUrl}`);
        toast('Teks dan tautan profil tersalin. Tempel di media sosial Anda.');
      }
    } catch (e) {
      // Membatalkan lembar berbagi bukan galat.
      if (!(e instanceof DOMException && e.name === 'AbortError')) toast('Gagal membagikan kartu.', 'error');
    } finally {
      setSibuk(null);
    }
  }

  return (
    <dialog
      ref={ref}
      className="cel"
      aria-labelledby="cel-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={`cel-in${fresh ? ' fresh' : ''}`}>
        {fresh && (
          <div className="cel-burst" aria-hidden>
            {Array.from({ length: 18 }, (_, k) => (
              <i key={k} style={{ '--k': k } as React.CSSProperties} />
            ))}
          </div>
        )}
        <p className="cel-kicker">{fresh ? 'Selamat!' : 'Tahap yang sudah Anda lewati'}</p>

        <article className={`cel-card is-${stage} stg-${stage}`} aria-label={`Kartu Journey ${r.name}`}>
          <header className="cel-card-top">
            <span className="cel-brand">
              <svg viewBox="-108 -118 244 236" aria-hidden>
                <path d="M 79.86 -60.18 A 100 100 0 1 0 79.86 60.18 L 49.52 37.31 A 62 62 0 1 1 49.52 -37.31 Z" />
                <path d="M 126.5 -87.7 Q 108.05 -84.22 104.8 -64.5 Q 101.55 -84.22 83.1 -87.7 Q 101.55 -91.18 104.8 -110.9 Q 108.05 -91.18 126.5 -87.7 Z" />
              </svg>
              <span translate="no">
                <b>CATALYST</b>
                <small>PASSPORT</small>
              </span>
            </span>
            <span className="cel-id">{p.catalystId}</span>
          </header>

          <div className="cel-medal">
            <span className="cel-ring r1" aria-hidden />
            <span className="cel-ring r2" aria-hidden />
            <span className={`cel-disc${foto ? ' foto' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- foto profil dari Storage atau penyedia login */}
              {foto ? <img src={foto} alt={`Foto ${p.fullName}`} /> : <Icon name={`j-${stage}`} />}
            </span>
            {foto && (
              <span className="cel-badge" title={r.name}>
                <Icon name={`j-${stage}`} />
              </span>
            )}
          </div>

          <p className="cel-unlock">Journey Unlocked</p>
          <h2 id="cel-title" className="cel-stage">
            {r.name}
          </h2>
          <p className="cel-sum">
            Tahap {i + 1} dari {STAGES.length} · {r.summary}
          </p>

          <ol className="cel-streak" aria-label={`${i + 1} dari ${STAGES.length} tahap tercapai`}>
            {STAGES.map((s, k) => (
              <li key={s} className={`stg-${s}${k <= i ? ' on' : ''}${k === i ? ' now' : ''}`} title={STAGE_RULES[s].name}>
                {k < i && <Icon name="check" />}
              </li>
            ))}
          </ol>

          <footer className="cel-card-foot">
            <span>
              <b>{p.fullName}</b>
              <small>{p.headline ? `${p.headline} · ${tanggal()}` : tanggal()}</small>
            </span>
            <span className="end">
              <b>{alamat}</b>
              <small>Accelerating Future Builders</small>
            </span>
          </footer>
        </article>

        {r.points > 0 && fresh && (
          <p className="cel-reward">
            <Icon name="bolt" /> +{r.points} poin CATA{r.perk ? ` · ${r.perk}` : ''}
          </p>
        )}

        <div className="cel-act">
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => void bagikan()} disabled={!!sibuk} data-autofocus>
            <Icon name="share" />
            {sibuk === 'bagi' ? 'Menyiapkan…' : 'Bagikan'}
          </button>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void unduh()} disabled={!!sibuk}>
            <Icon name="download" />
            {sibuk === 'unduh' ? 'Menyiapkan…' : 'Unduh gambar'}
          </button>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { copyText } from '@/components/passport/cards/copy';
import { NILAI } from '@/components/passport/cards/RailCards';
import { BrandMark, Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { publicUrl } from '@/components/passport/profile/links';

/**
 * Kepala profil publik: pil merek, tautan ke situs utama, salin tautan
 * profil, dan ajakan membuat Passport. Melayang sebagai kaca tipis dan
 * menebal sedikit begitu halaman digulir.
 * Tautan ke situs utama memakai <a> biasa karena berada di luar aplikasi Next.
 */
export function PublicHeader({ slug, name }: { slug?: string; name?: string }) {
  const toast = useToast();
  const [gulir, setGulir] = useState(false);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    const cek = () => setGulir(window.scrollY > 8);
    cek();
    addEventListener('scroll', cek, { passive: true });
    return () => removeEventListener('scroll', cek);
  }, []);

  async function bagikan() {
    if (!slug) return;
    const url = publicUrl(slug);
    const sentuh = matchMedia('(pointer: coarse)').matches;
    if (sentuh && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name ? `${name} · Catalyst Passport` : 'Catalyst Passport', url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    const r = await copyText(url, null);
    if (r === 'ok') {
      toast('Tautan profil tersalin', 'ok');
      setTersalin(true);
      setTimeout(() => setTersalin(false), 1800);
    } else toast(`Salin manual: ${url}`, 'info');
  }

  return (
    <header className={`pub-top${gulir ? ' scrolled' : ''}`}>
      <a href="/" className="pass-brand-pill" aria-label="Catalyst Society">
        <BrandMark />
        <span className="word" translate="no">
          <b>CATALYST</b>
          <span>PASSPORT</span>
        </span>
      </a>

      <nav className="pub-nav" aria-label="Catalyst Society">
        <a href="/#about">Tentang</a>
        <a href="/#ecosystem">Ekosistem</a>
        <a href="/#community">Komunitas</a>
        <a href="/#programs">Program</a>
      </nav>

      <div className="pub-act">
        {slug && (
          <button type="button" className="pub-icon" onClick={() => void bagikan()} aria-label="Bagikan profil ini" title="Bagikan profil ini">
            <Icon name={tersalin ? 'check' : 'share'} />
          </button>
        )}
        <a href="/" className="pub-site">
          catalystsociety.id
          <Icon name="arrow" className="pub-arrow" />
        </a>
        <a href="/login?mode=daftar" className="ui-btn ui-btn-primary pub-cta">
          Buat Passport
        </a>
      </div>
    </header>
  );
}

/** Pita di bawah kepala: menegaskan profil ini resmi dari Catalyst Society. */
export function PublicBadge({ catalystId }: { catalystId: string }) {
  return (
    <div className="pub-badge">
      <span className="pub-dot" aria-hidden />
      <span>
        Passport resmi <b>Catalyst Society</b>
      </span>
      <span className="pub-sep" aria-hidden />
      <span className="pub-id">{catalystId}</span>
    </div>
  );
}

/**
 * Penutup profil: ajakan membuat Passport dan empat nilai Catalyst dalam satu
 * kartu gelap, lalu baris hak cipta. Menggantikan pita nilai yang dulu menempel
 * langsung di bawah kartu ajakan.
 */
export function PublicCta() {
  return (
    <section className="pub-end" aria-labelledby="pub-cta-h">
      <div className="pub-end-card">
        <div className="pub-cta-glow" aria-hidden />
        <div className="pub-end-top">
          <div className="pub-end-copy">
            <span className="pub-cta-kicker">Catalyst Society</span>
            <h2 id="pub-cta-h">Bangun Passport dan Journey Anda sendiri</h2>
            <p>Satu profil untuk keahlian, projek, komunitas, dan setiap langkah Anda di ekosistem builder Indonesia.</p>
          </div>
          <div className="pub-cta-act">
            <a href="/login?mode=daftar" className="ui-btn pub-cta-main">
              Buat Passport gratis
            </a>
            <a href="/" className="ui-btn pub-cta-ghost">
              Jelajahi catalystsociety.id
              <Icon name="arrow" className="pub-arrow" />
            </a>
          </div>
        </div>
        <ul className="pub-values">
          {NILAI.map((n) => (
            <li key={n.title}>
              <span className="pub-value-ico" aria-hidden>
                <Icon name={n.icon} />
              </span>
              <b>{n.title}</b>
              <p>{n.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <footer className="pub-end-foot">
        <a href="/" className="pub-end-brand" aria-label="Catalyst Society">
          <BrandMark />
          <span translate="no">
            <b>CATALYST</b>
            <small>PASSPORT</small>
          </span>
        </a>
        <span>© 2026 PT Katalis Akselerasi Indonesia · Accelerating Future Builders.</span>
      </footer>
    </section>
  );
}

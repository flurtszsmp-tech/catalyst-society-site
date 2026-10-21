'use client';

import { Flag } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LANGS, type Lang } from '@/lib/i18n/dict';
import { useLang } from '@/lib/i18n/provider';

const NAMA: Record<Lang, string> = { id: 'Bahasa Indonesia', en: 'English', zh: '中文' };

export function AppearanceCard() {
  const { lang, setLang } = useLang();

  return (
    <section className="pf-card" aria-labelledby="pf-tampil-h">
      <div className="pf-card-head">
        <div>
          <h2 id="pf-tampil-h">Tampilan</h2>
          <p>Disimpan di perangkat ini saja.</p>
        </div>
      </div>

      <div className="pf-row">
        <div>
          <p className="ui-label">Tema terang / gelap</p>
          <p className="ui-hint">Tekan tombol untuk berganti tema.</p>
        </div>
        <ThemeToggle className="pf-theme" />
      </div>

      <div className="pf-sep">
        <fieldset className="pf-seg-set">
          <legend className="ui-label">Bahasa</legend>
          <div className="pf-seg">
            {LANGS.map((l) => (
              <label key={l} className={`pf-seg-opt${lang === l ? ' on' : ''}`}>
                <input type="radio" name="pf-lang" value={l} checked={lang === l} onChange={() => setLang(l)} />
                <Flag lang={l} className="pf-flag" />
                <span lang={l}>{NAMA[l]}</span>
              </label>
            ))}
          </div>
          <p className="ui-hint">Berlaku untuk situs Catalyst Society. Sebagian halaman Passport saat ini hanya berbahasa Indonesia.</p>
        </fieldset>
      </div>
    </section>
  );
}

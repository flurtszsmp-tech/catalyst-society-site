import { T } from '@/lib/i18n/provider';
import { BrandMark, Icon } from '@/components/ui/Icon';

/** Kaki halaman situs pemasaran. `onLanding` mengubah tautan bagian menjadi jangkar lokal. */
export function SiteFooter({ onLanding = false }: { onLanding?: boolean }) {
  const b = (id: string) => (onLanding ? `#${id}` : `/#${id}`);
  return (
    <footer>
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <a href="/" className="lockup">
            <BrandMark />
            <span className="word" translate="no">
              <b>CATALYST</b>
              <span>SOCIETY</span>
            </span>
          </a>
          <p>
            <span translate="no">Learn. Earn. Impact.</span>
          </p>
        </div>
        <div className="foot-cols">
          <div className="fc">
            <b>
              <T k="foot.ekosistem" />
            </b>
            <a href={b('problem')}>
              <T k="nav.masalah" />
            </a>
            <a href={b('ecosystem')}>
              <T k="nav.ekosistem" />
            </a>
            <a href={b('industries')}>
              <T k="nav.industri" />
            </a>
          </div>
          <div className="fc">
            <b>
              <T k="foot.program" />
            </b>
            <a href="/app.html#passport">Passport &amp; Finder</a>
            <a href={b('programs')}>Academy &amp; Labs</a>
            <a href={b('summit')}>Ventures &amp; Summit</a>
          </div>
          <div className="fc">
            <b>
              <T k="nav.community" />
            </b>
            <a href="/#community">Investments</a>
            <a href="/#community">AI &amp; Technology</a>
            <a href="/#community">Builder</a>
          </div>
          <div className="fc">
            <b>
              <T k="foot.terhubung" />
            </b>
            <a className="sosial" href="https://www.instagram.com/catalystsociety.id/" target="_blank" rel="noopener noreferrer">
              <Icon name="ig" />
              <span translate="no">catalystsociety.id</span>
            </a>
            <a href="https://catalystsociety.id" target="_blank" rel="noopener noreferrer">
              <span translate="no">catalystsociety.id</span>
            </a>
          </div>
        </div>
      </div>
      <div className="foot-bottom">
        <T k="foot.hak" />
        <a className="sosial" href="https://www.instagram.com/catalystsociety.id/" target="_blank" rel="noopener noreferrer">
          <Icon name="ig" />
          <span translate="no">catalystsociety.id</span>
        </a>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { BrandMark, Icon } from '@/components/ui/Icon';
import { STAGES, type Profile } from '@/lib/types';
import { Avatar } from './Avatar';
import { CopyButton } from './CopyButton';
import { ShareButton } from './ShareButton';
import { angka, stageIndex, stageName } from './format';

interface Props {
  profile: Profile;
  communities: number;
  badges: number;
  /** true di dasbor pemilik: tampilkan Edit Profile dan tombol bagikan. */
  owner?: boolean;
  shareUrl?: string;
}

/** Kartu hitam Catalyst Passport di puncak dasbor dan profil publik. */
export function HeroCard({ profile: p, communities, badges, owner = false, shareUrl }: Props) {
  const i = stageIndex(p.journeyStage);
  // Kemajuan diukur dari posisi tahap di antara enam tahap, bukan dari poin.
  const maju = (i / (STAGES.length - 1)) * 100;

  return (
    <section className="pass-hero" aria-label="Catalyst Passport">
      <div className="pass-hero-cap">Catalyst Passport</div>

      {owner && (
        <div className="pass-hero-act">
          <Link className="pass-edit" href="/passport/profile">
            <Icon name="pencil" />
            Edit Profile
          </Link>
          {shareUrl && <ShareButton url={shareUrl} title={`${p.fullName} — Catalyst Society`} />}
        </div>
      )}

      <div className="pass-idbox">
        <div>
          <span className="cap">Catalyst ID</span>
          <b>{p.catalystId}</b>
        </div>
        <CopyButton text={p.catalystId} label="Salin Catalyst ID" done="Catalyst ID tersalin" />
      </div>

      <BrandMark className="mark pass-hero-mark" />

      <div className="pass-hero-top">
        <Avatar person={p} size={232} className="pass-photo" alt={p.fullName} />
        <div className="pass-hero-body">
          <h1>
            {p.fullName}
            {p.isVerified && (
              <span className="pass-verified-wrap" title="Terverifikasi">
                <Icon name="verified" className="pass-verified" />
                <span className="sr-only">Terverifikasi</span>
              </span>
            )}
          </h1>
          {p.headline && <div className="pass-role">{p.headline}</div>}
          {p.location && (
            <div className="pass-loc">
              <Icon name="pin" />
              {p.location}
            </div>
          )}
          {p.skills.length > 0 && (
            <ul className="pass-skills" aria-label="Keahlian">
              {p.skills.map((s) => (
                <li key={s} className="pass-skill">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <dl className="pass-stats">
        <div className="pass-stat">
          <dt>CATA Points</dt>
          <dd>
            <Icon name="bolt" />
            {angka(p.cataPoints)}
          </dd>
        </div>
        <div className="pass-stat">
          <dt>Communities</dt>
          <dd>{communities}</dd>
        </div>
        <div className="pass-stat">
          <dt>Badges</dt>
          <dd>{badges}</dd>
        </div>
        <div className="pass-stat">
          <dt>Journey Stage</dt>
          <dd className={`pass-stage-dd stg-${p.journeyStage}`}>
            <i aria-hidden />
            {stageName(p.journeyStage)}
          </dd>
        </div>
      </dl>

      <div className={`pass-prog stg-${p.journeyStage}`}>
        <div className="pass-prog-lbl">
          <span>{stageName(p.journeyStage)}</span>
          <span>{stageName(STAGES[STAGES.length - 1])}</span>
        </div>
        <div
          className="pass-prog-bar"
          role="progressbar"
          aria-label="Kemajuan journey"
          aria-valuemin={1}
          aria-valuemax={STAGES.length}
          aria-valuenow={i + 1}
          aria-valuetext={`Tahap ${i + 1} dari ${STAGES.length}: ${stageName(p.journeyStage)}`}
        >
          <i style={{ width: `${maju.toFixed(1)}%` }} />
        </div>
      </div>
    </section>
  );
}

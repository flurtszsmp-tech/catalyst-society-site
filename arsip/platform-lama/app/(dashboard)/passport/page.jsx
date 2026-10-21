"use client";

import { useState } from "react";
import { useCatalyst } from "@/lib/useCatalyst";
import { CHANNEL, CHANNEL_OPTIONS, angka, cap, inisial, JOURNEY } from "@/lib/catalyst";

const ABOUT_MAX = 500;

export default function PassportPage() {
  const {
    dataLoading,
    prof,
    idxStage,
    journeyEvents,
    komunitas,
    badges,
    certs,
    updateProfile,
  } = useCatalyst();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [fNama, setFNama] = useState("");
  const [fHeadline, setFHeadline] = useState("");
  const [fLokasi, setFLokasi] = useState("");
  const [fAbout, setFAbout] = useState("");
  const [fChannel, setFChannel] = useState("business");
  const [fSkills, setFSkills] = useState("");
  const [fIg, setFIg] = useState("");
  const [fLinkedin, setFLinkedin] = useState("");
  const [fWebsite, setFWebsite] = useState("");

  if (dataLoading || !prof) return <section className="page"><div className="empty">Memuat...</div></section>;

  function bukaEdit() {
    setFNama(prof.full_name || "");
    setFHeadline(prof.headline || "");
    setFLokasi(prof.location || "");
    setFAbout(prof.about || "");
    setFChannel(prof.channel || "business");
    setFSkills((prof.skills || []).join(", "));
    setFIg((prof.links && prof.links.instagram) || "");
    setFLinkedin((prof.links && prof.links.linkedin) || "");
    setFWebsite((prof.links && prof.links.website) || "");
    setMsg(null);
    setEditing(true);
  }

  async function simpan(e) {
    e.preventDefault();
    if (!fNama.trim()) {
      setMsg({ teks: "Nama wajib diisi.", jenis: "err" });
      return;
    }
    if (fAbout.length > ABOUT_MAX) {
      setMsg({ teks: `About maksimal ${ABOUT_MAX} karakter.`, jenis: "err" });
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fNama.trim(),
      headline: fHeadline.trim(),
      location: fLokasi.trim(),
      about: fAbout.trim(),
      channel: fChannel,
      skills: fSkills.split(",").map((s) => s.trim()).filter(Boolean),
      links: { instagram: fIg.trim(), linkedin: fLinkedin.trim(), website: fWebsite.trim() },
    });
    setSaving(false);
    if (error) {
      setMsg({ teks: error, jenis: "err" });
      return;
    }
    setMsg({ teks: "Profil tersimpan.", jenis: "ok" });
    setEditing(false);
  }

  const ch = CHANNEL[prof.channel];
  const tags = prof.skills && prof.skills.length ? prof.skills.slice(0, 4) : ch ? [ch.label] : [];

  return (
    <section className="page">
      <div className="phead">
        <h1>Catalyst Passport</h1>
        <p>Bangun identitas profesional dalam satu digital profile.</p>
      </div>

      <div className="pp" style={{ marginBottom: 14 }}>
        <div className="pp-glow" />
        <div className="pp-in">
          <div className="pp-ava">{inisial(prof.full_name)}</div>
          <div className="pp-body">
            <div className="pp-cap">Catalyst Passport</div>
            <div className="pp-name">
              <span>{prof.full_name}</span>
              {prof.is_verified && (
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l2.4 1.8 3 .1.9 2.8 2.4 1.8-.9 2.8.9 2.8-2.4 1.8-.9 2.8-3 .1L12 22l-2.4-1.8-3-.1-.9-2.8L3.3 15.5l.9-2.8-.9-2.8 2.4-1.8.9-2.8 3-.1z" fill="#fff" />
                  <path d="m8.8 12.2 2.2 2.2 4.2-4.4" stroke="#000" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="pp-role">{prof.headline || "Member of Catalyst Society"}</div>
            <div className="pp-loc">
              <svg viewBox="0 0 24 24"><use href="#i-pin" /></svg>
              <span>{prof.location || "Indonesia"}</span>
            </div>
            <div className="pp-tags">
              {tags.map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
          <div className="pp-id"><div className="cap">Catalyst ID</div><b>{prof.catalyst_id}</b></div>
          <button className="pp-edit" onClick={bukaEdit}>Edit Profil</button>
        </div>

        <div className="pp-stats">
          <div><b>{angka(prof.cata_points)}</b><span>CATA Points</span></div>
          <div><b>{komunitas.length}</b><span>Communities</span></div>
          <div><b>{badges.length}</b><span>Badges</span></div>
          <div><b>{cap(prof.journey_stage || "explorer")}</b><span>Journey Stage</span></div>
        </div>

        <div className="pp-bar">
          <div className="lbl"><span>{cap(prof.journey_stage || "explorer")}</span><span>Innovator</span></div>
          <div className="pp-track">
            <div className="pp-fill" style={{ width: Math.round((idxStage / (JOURNEY.length - 1)) * 100) + "%" }} />
          </div>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="cap" style={{ marginBottom: 12 }}>Edit Profil</div>
          <form onSubmit={simpan}>
            <div className="ef-row">
              <div className="ef-field">
                <label htmlFor="ef-nama">Nama lengkap</label>
                <input id="ef-nama" value={fNama} onChange={(e) => setFNama(e.target.value)} required />
              </div>
              <div className="ef-field">
                <label htmlFor="ef-headline">Headline</label>
                <input id="ef-headline" value={fHeadline} onChange={(e) => setFHeadline(e.target.value)} placeholder="mis. Founder of Catalyst Society" />
              </div>
            </div>
            <div className="ef-row">
              <div className="ef-field">
                <label htmlFor="ef-lokasi">Lokasi</label>
                <input id="ef-lokasi" value={fLokasi} onChange={(e) => setFLokasi(e.target.value)} placeholder="mis. Jakarta Selatan, Indonesia" />
              </div>
              <div className="ef-field">
                <label htmlFor="ef-channel">Channel industri</label>
                <select id="ef-channel" value={fChannel} onChange={(e) => setFChannel(e.target.value)}>
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>{CHANNEL[c].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ef-field">
              <label htmlFor="ef-about">About</label>
              <textarea id="ef-about" value={fAbout} maxLength={ABOUT_MAX} onChange={(e) => setFAbout(e.target.value)} />
              <div className="count">{fAbout.length}/{ABOUT_MAX}</div>
            </div>
            <div className="ef-field">
              <label htmlFor="ef-skills">Skills (pisahkan dengan koma)</label>
              <input id="ef-skills" value={fSkills} onChange={(e) => setFSkills(e.target.value)} placeholder="mis. Leadership, Public Speaking" />
            </div>
            <div className="ef-row">
              <div className="ef-field">
                <label htmlFor="ef-ig">Instagram</label>
                <input id="ef-ig" value={fIg} onChange={(e) => setFIg(e.target.value)} placeholder="username" />
              </div>
              <div className="ef-field">
                <label htmlFor="ef-linkedin">LinkedIn</label>
                <input id="ef-linkedin" value={fLinkedin} onChange={(e) => setFLinkedin(e.target.value)} placeholder="username" />
              </div>
            </div>
            <div className="ef-field">
              <label htmlFor="ef-website">Website</label>
              <input id="ef-website" value={fWebsite} onChange={(e) => setFWebsite(e.target.value)} placeholder="https://" />
            </div>

            {msg && <div className={"ef-msg " + msg.jenis}>{msg.teks}</div>}

            <div className="ef-actions">
              <button className="ef-save" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              <button className="ef-cancel" type="button" onClick={() => setEditing(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="split">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="cap" style={{ marginBottom: 5 }}>About Me</div>
            <p style={{ fontSize: 12.5, color: "var(--d-gray)", lineHeight: 1.72 }}>
              {prof.about || "Belum ada deskripsi. Lengkapi profil Anda untuk tampil lebih menonjol di Finder."}
            </p>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="cap" style={{ marginBottom: 12 }}>Journey</div>
            <div className="jr">
              {JOURNEY.map((s, i) => {
                const ev = journeyEvents.find((e) => e.stage === s);
                const cls = i < idxStage ? "done" : i === idxStage ? "now" : "";
                return (
                  <div className={"jr-step " + cls} key={s}>
                    <div className="n">Tahap {i + 1}</div>
                    <b>{cap(s)}</b>
                    <small>{ev ? ev.detail || ev.title : "Belum tercapai"}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="cap" style={{ marginBottom: 12 }}>Communities</div>
            <div className="grid g3">
              {komunitas.length ? (
                komunitas.map((k, i) => {
                  const cc = CHANNEL[k.channel];
                  return (
                    <div className="card" style={{ padding: 13 }} key={k.name + i}>
                      <h3>{k.name}</h3>
                      <div className="cap" style={{ marginTop: 3 }}>{cc ? cc.label : ""}</div>
                    </div>
                  );
                })
              ) : (
                <div className="empty" style={{ gridColumn: "1/-1" }}>Belum bergabung ke komunitas mana pun.</div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="cap" style={{ marginBottom: 12 }}>Badges</div>
            <div className="bdg">
              {badges.length ? (
                badges.map((b, i) => (
                  <div key={b.name + i}>
                    <svg viewBox="0 0 24 24"><use href={"#i-" + (b.icon || "badge")} /></svg>
                    <b>{b.name}</b>
                  </div>
                ))
              ) : (
                <div className="empty" style={{ gridColumn: "1/-1" }}>Badge pertama menanti. Mulai dari bergabung ke komunitas.</div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="cap" style={{ marginBottom: 12 }}>Certificates</div>
            {certs.length ? (
              certs.map((c, i) => (
                <div className="evt" key={c.cert_code + i}>
                  <div className="evt-date">
                    <b>{new Date(c.issued_at).getDate()}</b>
                    <span>{new Date(c.issued_at).toLocaleDateString("id-ID", { month: "short" })}</span>
                  </div>
                  <div className="evt-body"><b>{c.title}</b><small>{c.issuer} · {c.cert_code}</small></div>
                </div>
              ))
            ) : (
              <div className="empty">Belum ada sertifikat. Selesaikan kursus di Academy.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

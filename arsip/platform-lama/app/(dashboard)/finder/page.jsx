"use client";

import { useMemo, useState } from "react";
import { useCatalyst } from "@/lib/useCatalyst";
import { angka, tanggal } from "@/lib/catalyst";

const KIND_LABEL = { hiring: "Hiring", partner: "Partner", fundraising: "Fundraising", support: "Support" };

const FILTERS = [
  { label: "Semua", kind: "" },
  { label: "Hiring", kind: "hiring" },
  { label: "Looking for Partner", kind: "partner" },
  { label: "Fundraising", kind: "fundraising" },
  { label: "Seeking Support", kind: "support" },
];

export default function FinderPage() {
  const { dataLoading, opportunities, lamaran, ajukanLamaran } = useCatalyst();
  const [kind, setKind] = useState("");
  const [cari, setCari] = useState("");
  const [mengirim, setMengirim] = useState(null);

  const list = useMemo(() => {
    return opportunities.filter((o) => {
      if (kind && o.kind !== kind) return false;
      if (cari) {
        const t = (o.title + " " + (o.org_name || "") + " " + (o.category || "") + " " + (o.tags || []).join(" ")).toLowerCase();
        if (t.indexOf(cari.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }, [opportunities, kind, cari]);

  if (dataLoading) return <section className="page"><div className="empty">Memuat...</div></section>;

  async function ajukan(id) {
    setMengirim(id);
    await ajukanLamaran(id);
    setMengirim(null);
  }

  return (
    <section className="page">
      <div className="phead">
        <h1>Catalyst Finder</h1>
        <p>Temukan peluang dan dukung inovasi yang berdampak.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Cari peluang..."
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          style={{ width: "100%", maxWidth: 320, padding: "9px 14px", border: "1px solid var(--line)", borderRadius: 100, fontSize: 12.5, marginBottom: 12 }}
        />
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.kind} className={kind === f.kind ? "on" : ""} onClick={() => setKind(f.kind)}>{f.label}</button>
        ))}
      </div>

      <div className="grid g4">
        {list.length ? (
          list.map((o) => {
            const sudah = lamaran.indexOf(o.id) >= 0;
            const pct = o.kind === "fundraising" && o.funding_goal ? Math.min(100, Math.round(((o.funding_raised || 0) / o.funding_goal) * 100)) : null;
            return (
              <article className="opp" key={o.id}>
                <div className="opp-top"><span className="opp-kind">{KIND_LABEL[o.kind] || o.kind}</span></div>
                <div className="opp-body">
                  <h4>{o.title}</h4>
                  <div className="org">{o.org_name || (o.profiles && o.profiles.full_name) || ""}{o.location ? " · " + o.location : ""}</div>
                  {o.description && <p>{o.description}</p>}
                  {o.tags && o.tags.length > 0 && (
                    <div className="opp-tags">{o.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}</div>
                  )}
                  {pct !== null && (
                    <div className="fund">
                      <div className="row"><span>{pct}% terkumpul</span><span>Rp {angka(o.funding_goal)}</span></div>
                      <div className="track"><div className="bar" style={{ width: pct + "%" }} /></div>
                    </div>
                  )}
                  <div className="opp-foot">
                    <small style={{ fontSize: 10.5, color: "var(--gray)" }}>{tanggal(o.created_at)}</small>
                    <button disabled={sudah || mengirim === o.id} onClick={() => ajukan(o.id)}>
                      {sudah ? "Sudah diajukan" : mengirim === o.id ? "Mengirim" : "Ajukan"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty" style={{ gridColumn: "1/-1" }}>Belum ada peluang yang cocok.</div>
        )}
      </div>
    </section>
  );
}

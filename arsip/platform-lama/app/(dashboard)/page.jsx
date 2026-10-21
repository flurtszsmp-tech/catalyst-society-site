"use client";

import { useCatalyst } from "@/lib/useCatalyst";
import { angka, cap } from "@/lib/catalyst";

const ALUR = [
  ["Community", "Join komunitas di industri pilihan"],
  ["Academy", "Belajar via E-Course, Event, Workshop"],
  ["Matchmaking", "Bertemu partners, mentors, jobs"],
  ["Labs", "Bangun project bersama mentor"],
  ["Ventures", "Cari pendanaan hingga bertemu investor"],
  ["Summit", "Showcase project di event tahunan"],
];

export default function HomePage() {
  const { dataLoading, prof, komunitas, badges, kursus, enrollments, events, ikutEvent, eventDiikuti } = useCatalyst();

  if (dataLoading || !prof) return <section className="page"><div className="empty">Memuat...</div></section>;

  const berjalan = Object.values(enrollments).filter((e) => !e.completed_at).slice(0, 3);

  return (
    <section className="page">
      <div className="phead">
        <h1>Selamat datang kembali, <span>{prof.full_name.split(" ")[0]}</span>.</h1>
        <p>Ekosistem Anda hari ini: komunitas, peluang, dan kelas yang sedang berjalan.</p>
      </div>

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card"><div className="cap">CATA Points</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{angka(prof.cata_points)}</h3></div>
        <div className="card"><div className="cap">Komunitas</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{komunitas.length}</h3></div>
        <div className="card"><div className="cap">Badge</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{badges.length}</h3></div>
        <div className="card dark"><div className="cap">Journey Stage</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{cap(prof.journey_stage || "explorer")}</h3></div>
      </div>

      <div className="split">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="cap" style={{ marginBottom: 12 }}>Alur ekosistem Anda</div>
            <div className="jr">
              {ALUR.map((a, i) => (
                <div key={a[0]} className={"jr-step" + (i === 0 ? " now" : "")}>
                  <div className="n">{"0" + (i + 1)}</div>
                  <b>{a[0]}</b>
                  <small>{a[1]}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="cap" style={{ marginBottom: 12 }}>Kelas yang sedang berjalan</div>
            {berjalan.length ? (
              berjalan.map((e) => {
                const c = kursus.find((k) => k.id === e.course_id);
                return (
                  <div key={e.course_id} style={{ padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
                      <b>{c ? c.title : ""}</b><span style={{ color: "var(--gray)" }}>{e.progress}%</span>
                    </div>
                    <div style={{ height: 3, background: "var(--l-gray)", borderRadius: 100, marginTop: 7, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: e.progress + "%", background: "var(--black)", borderRadius: 100 }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">Belum ada kelas berjalan. Buka Academy untuk mulai.</div>
            )}
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="cap" style={{ marginBottom: 10 }}>Event mendatang</div>
            {events.length ? (
              events.map((e) => {
                const d = new Date(e.starts_at);
                const diikuti = eventDiikuti.indexOf(e.id) >= 0;
                return (
                  <div className="evt" key={e.id}>
                    <div className="evt-date"><b>{d.getDate()}</b><span>{d.toLocaleDateString("id-ID", { month: "short" })}</span></div>
                    <div className="evt-body"><b>{e.title}</b><small>{e.speaker || ""}{e.location ? " · " + e.location : ""}</small></div>
                    <button disabled={diikuti} onClick={() => ikutEvent(e.id)}>{diikuti ? "Terdaftar" : "Join"}</button>
                  </div>
                );
              })
            ) : (
              <div className="empty">Belum ada event terjadwal.</div>
            )}
          </div>
          <div className="card dark">
            <div className="cap" style={{ marginBottom: 8 }}>Apa yang Anda dapatkan</div>
            <ul style={{ fontSize: 11.5, lineHeight: 2, color: "#c2c2c2" }}>
              <li>Join the Community</li><li>Access to the Event</li><li>Collaboration</li>
              <li>Growing a Business</li><li>Fundraising</li><li>Job Opportunities</li>
              <li>Contest &amp; Competitions</li><li>Networking &amp; Sharing</li>
              <li>Building a Project</li><li>Showcasing a Project</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

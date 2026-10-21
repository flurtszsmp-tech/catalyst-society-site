"use client";

import { useCatalyst } from "@/lib/useCatalyst";
import { angka } from "@/lib/catalyst";

export default function AcademyPage() {
  const { dataLoading, kursus, enrollments, events, lanjutkanKursus } = useCatalyst();

  if (dataLoading) return <section className="page"><div className="empty">Memuat...</div></section>;

  const daftarEnrol = Object.values(enrollments);
  const jalan = daftarEnrol.filter((e) => !e.completed_at).length;
  const selesai = daftarEnrol.filter((e) => !!e.completed_at).length;
  const xp = daftarEnrol.reduce((s, e) => {
    const k = kursus.find((c) => c.id === e.course_id);
    return s + (k ? Math.round(k.xp_reward * (e.progress / 100)) : 0);
  }, 0);
  const certCount = daftarEnrol.filter((e) => !!e.completed_at).length;

  return (
    <section className="page">
      <div className="phead">
        <h1>Catalyst Academy</h1>
        <p>Belajar langsung dari praktisi industri. Learn. Earn. Impact.</p>
      </div>

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card"><div className="cap">Sedang berjalan</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{jalan}</h3></div>
        <div className="card"><div className="cap">Selesai</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{selesai}</h3></div>
        <div className="card"><div className="cap">Sertifikat</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{certCount}</h3></div>
        <div className="card dark"><div className="cap">XP Earned</div><h3 style={{ fontSize: 23, marginTop: 5 }}>{angka(xp)}</h3></div>
      </div>

      <div className="split">
        <div>
          <div className="cap" style={{ marginBottom: 11 }}>Explore Top Categories</div>
          <div className="grid g3">
            {kursus.map((c) => {
              const e = enrollments[c.id];
              const prog = e ? e.progress : 0;
              return (
                <article className="crs" key={c.id}>
                  <div className="crs-top">
                    <span className="crs-cat">{c.category}</span>
                    <h4>{c.title}</h4>
                  </div>
                  <div className="crs-body">
                    <p>{c.description || ""}</p>
                    <div className="crs-meta"><span>{c.lesson_count} lesson</span><span>{c.hours} jam</span><span>★ {c.rating}</span></div>
                    {e && (
                      <div className="crs-prog">
                        <div className="row"><span>Progress</span><span>{prog}%</span></div>
                        <div className="track"><div className="bar" style={{ width: prog + "%" }} /></div>
                      </div>
                    )}
                    <button className={"crs-btn" + (e ? " ghost" : "")} onClick={() => lanjutkanKursus(c.id, c.xp_reward)}>
                      {e ? (e.completed_at ? "Selesai" : "Lanjutkan") : "Mulai belajar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div>
          <div className="card">
            <div className="cap" style={{ marginBottom: 10 }}>Upcoming Events</div>
            {events.length ? (
              events.map((e) => {
                const d = new Date(e.starts_at);
                return (
                  <div className="evt" key={e.id}>
                    <div className="evt-date"><b>{d.getDate()}</b><span>{d.toLocaleDateString("id-ID", { month: "short" })}</span></div>
                    <div className="evt-body"><b>{e.title}</b><small>{e.speaker || ""}{e.location ? " · " + e.location : ""}</small></div>
                  </div>
                );
              })
            ) : (
              <div className="empty">Belum ada event terjadwal.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

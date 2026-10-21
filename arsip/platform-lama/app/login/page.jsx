"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";
import { db, SUPABASE_SIAP } from "@/lib/supabase";

const BERANDA_URL = "https://website-ten-xi-m1457gdu77.vercel.app";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setModeState] = useState("masuk");
  const [tampilSwap, setTampilSwap] = useState(false);
  const [nama, setNama] = useState("");
  const [channel, setChannel] = useState("business");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [pesan, setPesan] = useState({ teks: "", jenis: "" });
  const [mengirim, setMengirim] = useState(false);
  const [turun, setTurun] = useState(false);
  const tabsRef = useRef(null);
  const aktifRef = useRef(null);

  useEffect(() => {
    const f1 = requestAnimationFrame(() => requestAnimationFrame(() => setTurun(true)));
    const t1 = setTimeout(() => setTurun(true), 900);
    return () => {
      cancelAnimationFrame(f1);
      clearTimeout(t1);
    };
  }, []);

  useEffect(() => {
    geserPil();
    window.addEventListener("resize", geserPil);
    return () => window.removeEventListener("resize", geserPil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!SUPABASE_SIAP) {
      setPesan({
        teks: "Kredensial Supabase belum diisi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY, lalu jalankan supabase-schema.sql di SQL Editor.",
        jenis: "warn",
      });
      return;
    }
    db.auth.getSession().then((r) => {
      if (r.data.session) router.replace("/");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function geserPil() {
    const tabs = tabsRef.current;
    const aktif = aktifRef.current;
    if (!tabs || !aktif) return;
    const t = aktif.getBoundingClientRect();
    const c = tabs.getBoundingClientRect();
    tabs.style.setProperty("--pil-w", t.width + "px");
    tabs.style.setProperty("--pil-x", t.left - c.left + "px");
  }

  function gantiMode(m) {
    if (m === mode) return;
    setTampilSwap(true);
    setTimeout(() => {
      setModeState(m);
      setTampilSwap(false);
      setPesan({ teks: "", jenis: "" });
    }, 220);
  }

  async function kirim(e) {
    e.preventDefault();
    if (!db) return;
    const emailV = email.trim();
    const namaV = nama.trim();

    if (!emailV || !sandi) {
      setPesan({ teks: "Email dan kata sandi wajib diisi.", jenis: "err" });
      return;
    }
    if (mode === "daftar") {
      if (sandi.length < 6) {
        setPesan({ teks: "Kata sandi minimal 6 karakter.", jenis: "err" });
        return;
      }
      if (!namaV) {
        setPesan({ teks: "Nama lengkap wajib diisi.", jenis: "err" });
        return;
      }
    }

    setMengirim(true);
    try {
      if (mode === "daftar") {
        const res = await db.auth.signUp({
          email: emailV,
          password: sandi,
          options: { data: { full_name: namaV, channel } },
        });
        if (res.error) throw res.error;
        if (res.data.session) {
          router.replace("/");
          return;
        }
        gantiMode("masuk");
        setPesan({ teks: "Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.", jenis: "ok" });
      } else {
        const login = await db.auth.signInWithPassword({ email: emailV, password: sandi });
        if (login.error) throw login.error;
        router.replace("/");
        return;
      }
    } catch (err) {
      let m = (err && err.message) || "Terjadi kesalahan.";
      if (/invalid login credentials/i.test(m)) m = "Email atau kata sandi salah.";
      if (/already registered/i.test(m)) m = "Email ini sudah terdaftar. Silakan masuk.";
      if (/email not confirmed/i.test(m)) m = "Email belum dikonfirmasi. Cek kotak masuk Anda.";
      setPesan({ teks: m, jenis: "err" });
    } finally {
      setMengirim(false);
    }
  }

  const daftar = mode === "daftar";

  return (
    <div className="login-root">
      <div className={"tirai" + (turun ? " turun" : "")} aria-hidden="true" />

      <div className="shell">
        <aside className="brandside">
          <div className="bs-glow" />
          <div className="bs-top">
            <svg viewBox="-108 -118 244 236" aria-hidden="true">
              <path d="M 79.86 -60.18 A 100 100 0 1 0 79.86 60.18 L 49.52 37.31 A 62 62 0 1 1 49.52 -37.31 Z" />
              <path d="M 126.5 -87.7 Q 108.05 -84.22 104.8 -64.5 Q 101.55 -84.22 83.1 -87.7 Q 101.55 -91.18 104.8 -110.9 Q 108.05 -91.18 126.5 -87.7 Z" />
            </svg>
            <div className="bs-name">
              CATALYST
              <span>SOCIETY</span>
            </div>
          </div>

          <div className="bs-mid">
            <h1>
              Satu akun.
              <br />
              Seluruh
              <br />
              ekosistem.
            </h1>
            <p>
              Catalyst Society adalah ekosistem kolaboratif yang menghubungkan investor, profesional, builder,
              innovator dan learner di Indonesia melalui lima channel industri dan lima program berjenjang.
            </p>
            <div className="bs-flow">
              <div><i>Academy</i> Belajar lebih dalam industri melalui E-Course, Event, dan Workshop</div>
              <div><i>Matchmaking</i> Bertemu partners, mentors, workers, company, dan jobs</div>
              <div><i>Labs</i> Membangun project bersama mentor</div>
              <div><i>Ventures</i> Mencari pendanaan project hingga bertemu investor</div>
              <div><i>Summit</i> Showcase project dan sharing di event tahunan Catalyst</div>
            </div>
          </div>

          <div className="bs-bot">
            <span>Learn. Build. Impact.</span>
            <a className="bs-ig" href="https://www.instagram.com/catalystsociety.id/" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24"><use href="#i-ig" /></svg>catalystsociety.id
            </a>
          </div>
        </aside>

        <main className="formside">
          <div className={"card" + (tampilSwap ? " swap" : "")}>
            <div className="kicker">Catalyst Passport</div>
            <h2 id="judul">{daftar ? "Buat Catalyst Passport." : "Masuk ke akun Anda."}</h2>
            <p className="sub" id="sub">
              {daftar
                ? "Satu identitas untuk seluruh komunitas, program, dan peluang."
                : "Lanjutkan perjalanan Anda di Passport, Finder, dan Academy."}
            </p>

            <div className="tabs" ref={tabsRef}>
              <button
                ref={!daftar ? aktifRef : undefined}
                className={!daftar ? "on" : ""}
                type="button"
                onClick={() => gantiMode("masuk")}
              >
                Masuk
              </button>
              <button
                ref={daftar ? aktifRef : undefined}
                className={daftar ? "on" : ""}
                type="button"
                onClick={() => gantiMode("daftar")}
              >
                Daftar
              </button>
            </div>

            <form onSubmit={kirim} noValidate>
              <div className={"field anim" + (daftar ? " show" : "")}>
                <label htmlFor="nama">Nama lengkap</label>
                <input id="nama" type="text" autoComplete="name" placeholder="Bagas Dwi Putra" value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>

              <div className={"field anim" + (daftar ? " show" : "")}>
                <label htmlFor="channel">Channel industri</label>
                <select id="channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="business">Business (Businessman &amp; Entrepreneur)</option>
                  <option value="investments">Investments (Finance &amp; Investments)</option>
                  <option value="ai_technology">AI &amp; Technology</option>
                  <option value="builders">Builders (Developer &amp; Builder)</option>
                  <option value="social_impact">Social Impact (Sustainability &amp; Social Impact)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" placeholder="nama@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="sandi">Kata sandi</label>
                <input
                  id="sandi"
                  type="password"
                  autoComplete={daftar ? "new-password" : "current-password"}
                  placeholder="Minimal 6 karakter"
                  required
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
                <p className={"hint" + (daftar ? " show" : "")}>Gunakan minimal 6 karakter.</p>
              </div>

              <button className="submit" type="submit" disabled={!SUPABASE_SIAP || mengirim}>
                <span id="labelKirim">{mengirim ? "Memproses" : daftar ? "Daftar sekarang" : "Masuk"}</span>
                <svg viewBox="0 0 24 24"><use href="#i-arrow" /></svg>
              </button>
            </form>

            <div className={"msg" + (pesan.jenis ? " " + pesan.jenis : "")} role="status" aria-live="polite"
              dangerouslySetInnerHTML={{ __html: pesan.teks }} />

            <a className="back" href={BERANDA_URL}>
              <svg viewBox="0 0 24 24" style={{ transform: "rotate(180deg)" }}><use href="#i-arrow" /></svg>
              Kembali ke beranda
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}

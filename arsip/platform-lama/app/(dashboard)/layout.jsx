"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./dashboard.css";
import Logo from "../components/Logo";
import { useProfile } from "@/lib/useProfile";
import { keluar, SUPABASE_SIAP } from "@/lib/supabase";
import { angka, inisial } from "@/lib/catalyst";

const PROGRAM = [
  { href: "/passport", label: "Passport", icon: "i-user" },
  { href: "/finder", label: "Finder", icon: "i-search" },
  { href: "/academy", label: "Academy", icon: "i-cap" },
];

const SOON = [
  { label: "Communities", icon: "i-users" },
  { label: "Labs", icon: "i-flask" },
  { label: "Ventures", icon: "i-chart" },
  { label: "Summit", icon: "i-spark" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, demo, prof, belumLogin } = useProfile();

  /* Dock: hover membuka sementara, klik logo mengunci terbuka, klik lagi menutup. */
  const [open, setOpen] = useState(false);
  const terkunci = useRef(false);
  const redamHover = useRef(false);
  const timerTutup = useRef(0);
  const dockRef = useRef(null);
  const btnRef = useRef(null);
  const kursorHalus = useRef(false);

  useEffect(() => {
    kursorHalus.current = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    function onKey(e) {
      if (e.key === "Escape") {
        tutup();
        btnRef.current && btnRef.current.focus();
      }
    }
    function onPointerDown(e) {
      if (!kursorHalus.current && dockRef.current && !dockRef.current.contains(e.target)) tutup();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      clearTimeout(timerTutup.current);
    };
  }, []);

  function buka() {
    clearTimeout(timerTutup.current);
    setOpen(true);
  }
  function tutup() {
    clearTimeout(timerTutup.current);
    terkunci.current = false;
    setOpen(false);
  }
  function onEnter() {
    if (kursorHalus.current && !redamHover.current) buka();
  }
  function onLeave() {
    redamHover.current = false;
    if (!kursorHalus.current || terkunci.current) return;
    clearTimeout(timerTutup.current);
    timerTutup.current = setTimeout(tutup, 280);
  }
  function onKlikLogo() {
    if (terkunci.current) {
      tutup();
      redamHover.current = true;
    } else {
      terkunci.current = true;
      buka();
    }
  }
  function onPilih() {
    if (!terkunci.current || !kursorHalus.current) tutup();
  }

  if (!loading && belumLogin) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  async function handleKeluar() {
    if (SUPABASE_SIAP) await keluar();
    router.replace("/login");
  }

  return (
    <div className="dash-root">
      <div className="app">
        <aside
          className={"dock" + (open ? " open" : "")}
          id="side"
          ref={dockRef}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={(e) => {
            if (e.target.matches(":focus-visible")) buka();
          }}
          onBlur={(e) => {
            if (!terkunci.current && !(dockRef.current && dockRef.current.contains(e.relatedTarget))) tutup();
          }}
        >
          <button
            className="dock-pill"
            ref={btnRef}
            type="button"
            aria-expanded={open}
            aria-controls="dockMenu"
            aria-label="Menu Catalyst"
            onClick={onKlikLogo}
          >
            <span className="dock-mark"><Logo /></span>
            <span className="dock-word">
              CATALYST
              <span>SOCIETY</span>
            </span>
          </button>

          <div className="dock-menu" id="dockMenu">
            <nav className="dp dp1" aria-label="Program">
              <Link href="/" className={pathname === "/" ? "on" : ""} onClick={onPilih}>
                <svg viewBox="0 0 24 24"><use href="#i-home" /></svg>Home
              </Link>
              <div className="grp">Program</div>
              {PROGRAM.map((n) => (
                <Link key={n.href} href={n.href} className={pathname === n.href ? "on" : ""} onClick={onPilih}>
                  <svg viewBox="0 0 24 24"><use href={"#" + n.icon} /></svg>
                  {n.label}
                </Link>
              ))}
            </nav>

            <nav className="dp dp2" aria-label="Segera hadir">
              <div className="grp">Segera hadir</div>
              {SOON.map((s) => (
                <Link key={s.label} href="/soon" className={pathname === "/soon" ? "on" : ""} onClick={onPilih}>
                  <svg viewBox="0 0 24 24"><use href={"#" + s.icon} /></svg>
                  {s.label}
                </Link>
              ))}
            </nav>

            <div className="dp dp3">
              <a className="side-ig" href="https://www.instagram.com/catalystsociety.id/" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24"><use href="#i-ig" /></svg>catalystsociety.id
              </a>
              <button type="button" onClick={handleKeluar}>
                <svg viewBox="0 0 24 24"><use href="#i-out" /></svg>Keluar
              </button>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="top">
            <div className="search">
              <svg viewBox="0 0 24 24"><use href="#i-search" /></svg>
              <input type="search" placeholder="Cari peluang, kursus, komunitas..." />
            </div>
            <div className="top-right">
              <div className="xp">
                <svg viewBox="0 0 24 24"><use href="#i-bolt" /></svg>
                <b>{prof ? angka(prof.cata_points) : "0"}</b>
              </div>
              <div className="me">
                <div className="ava">{prof ? inisial(prof.full_name) : "?"}</div>
                <div>
                  <b>{prof ? prof.full_name : "Memuat"}</b>
                  <small>{prof ? prof.catalyst_id : "Memuat"}</small>
                </div>
              </div>
            </div>
          </header>

          {demo && (
            <div className="warn">
              <b>Mode contoh.</b> Seluruh modul di bawah ini berfungsi penuh memakai data contoh yang tersimpan di
              perangkat Anda. Untuk memakai akun sungguhan, isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code>, lalu jalankan{" "}
              <code>supabase-schema.sql</code> di Supabase SQL Editor.
            </div>
          )}

          {loading ? <div className="empty">Memuat...</div> : children}
        </div>
      </div>
    </div>
  );
}

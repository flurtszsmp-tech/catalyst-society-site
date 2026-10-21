"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "./supabase";
import { getDemoData, simpanDemoData } from "./demo-data";
import { useProfile } from "./useProfile";
import { JOURNEY } from "./catalyst";

export function useCatalyst() {
  const profileState = useProfile();
  const { demo, user, prof, loading: profLoading } = profileState;

  const [loading, setLoading] = useState(true);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [komunitas, setKomunitas] = useState([]);
  const [badges, setBadges] = useState([]);
  const [certs, setCerts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [kursus, setKursus] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [events, setEvents] = useState([]);
  const [lamaran, setLamaran] = useState([]);
  const [eventDiikuti, setEventDiikuti] = useState([]);

  const muat = useCallback(async () => {
    if (profLoading || !prof) return;

    if (demo) {
      const d = getDemoData();
      setJourneyEvents(d.journey.filter((e) => e.occurred_at));
      setKomunitas(d.komunitas);
      setBadges(d.badge);
      setCerts(d.sertifikat);
      setOpportunities(d.peluang);
      setKursus(d.kursus);
      setEnrollments(
        Object.fromEntries(
          Object.keys(d.kelas).map((id) => [
            id,
            { course_id: id, progress: d.kelas[id], completed_at: d.kelas[id] >= 100 ? "2026-06-10" : null },
          ])
        )
      );
      setEvents(d.event);
      setLamaran(d.lamaran);
      setEventDiikuti(d.eventDiikuti);
      setLoading(false);
      return;
    }

    if (!db || !user) return;

    const [jr, kom, ub, cs, opp, krs, enr, ev] = await Promise.all([
      db.from("journey_events").select("*").eq("user_id", user.id).order("occurred_at"),
      db.from("community_members").select("communities(name,channel)").eq("user_id", user.id),
      db.from("user_badges").select("badges(name,icon)").eq("user_id", user.id),
      db.from("certificates").select("*").eq("user_id", user.id).order("issued_at", { ascending: false }),
      db.from("opportunities").select("*, profiles(full_name)").eq("is_open", true).order("created_at", { ascending: false }),
      db.from("courses").select("*").order("created_at"),
      db.from("enrollments").select("*").eq("user_id", user.id),
      db.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
    ]);

    setJourneyEvents(jr.data || []);
    setKomunitas((kom.data || []).map((k) => k.communities));
    setBadges((ub.data || []).map((b) => b.badges));
    setCerts(cs.data || []);
    setOpportunities(opp.data || []);
    setKursus(krs.data || []);
    setEnrollments(Object.fromEntries((enr.data || []).map((e) => [e.course_id, e])));
    setEvents(ev.data || []);
    setLoading(false);
  }, [demo, user, prof, profLoading]);

  useEffect(() => {
    muat();
  }, [muat]);

  const idxStage = Math.max(0, JOURNEY.indexOf((prof && prof.journey_stage) || "explorer"));

  async function ajukanLamaran(oppId) {
    if (demo) {
      const d = getDemoData();
      if (d.lamaran.indexOf(oppId) < 0) {
        d.lamaran.push(oppId);
        simpanDemoData();
      }
      setLamaran([...d.lamaran]);
      return { sudah: d.lamaran.indexOf(oppId) >= 0 };
    }
    if (!db || !user) return { sudah: false, gagal: true };
    const r = await db.from("opportunity_applications").insert({ opportunity_id: oppId, user_id: user.id });
    if (r.error) return { sudah: /duplicate/i.test(r.error.message), gagal: !/duplicate/i.test(r.error.message) };
    setLamaran((l) => [...l, oppId]);
    return { sudah: false };
  }

  async function ikutEvent(eventId) {
    if (demo) {
      const d = getDemoData();
      if (d.eventDiikuti.indexOf(eventId) < 0) {
        d.eventDiikuti.push(eventId);
        simpanDemoData();
      }
      setEventDiikuti([...d.eventDiikuti]);
      return { gagal: false };
    }
    if (!db || !user) return { gagal: true };
    const r = await db.from("event_registrations").insert({ event_id: eventId, user_id: user.id });
    setEventDiikuti((e) => [...e, eventId]);
    return { gagal: !!r.error && !/duplicate/i.test(r.error.message) };
  }

  async function lanjutkanKursus(courseId) {
    const e = enrollments[courseId];
    if (demo) {
      const d = getDemoData();
      let p = d.kelas[courseId] || 0;
      p = e ? Math.min(100, p + 25) : 10;
      d.kelas[courseId] = p;
      simpanDemoData();
      const baru = { course_id: courseId, progress: p, completed_at: p >= 100 ? new Date().toISOString() : null };
      setEnrollments((prev) => ({ ...prev, [courseId]: baru }));
      return;
    }
    if (!db || !user) return;
    if (!e) {
      const r = await db.from("enrollments").insert({ user_id: user.id, course_id: courseId, progress: 10 }).select().single();
      if (!r.error) setEnrollments((prev) => ({ ...prev, [courseId]: r.data }));
    } else if (!e.completed_at) {
      const baru = Math.min(100, e.progress + 25);
      const upd = { progress: baru };
      if (baru === 100) upd.completed_at = new Date().toISOString();
      const r2 = await db.from("enrollments").update(upd).eq("user_id", user.id).eq("course_id", courseId).select().single();
      if (!r2.error) setEnrollments((prev) => ({ ...prev, [courseId]: r2.data }));
    }
  }

  return {
    ...profileState,
    dataLoading: loading || profLoading,
    idxStage,
    journeyEvents,
    komunitas,
    badges,
    certs,
    opportunities,
    kursus,
    enrollments,
    events,
    lamaran,
    eventDiikuti,
    ajukanLamaran,
    ikutEvent,
    lanjutkanKursus,
  };
}

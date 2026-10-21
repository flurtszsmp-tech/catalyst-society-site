/* ===========================================================
   Pemeta baris database ke tipe domain.

   Modul netral: tidak bertanda 'use client' dan tidak 'server-only',
   jadi dipakai bersama oleh SupabaseRepo (browser) dan halaman profil
   publik (server). Fungsi dari modul 'use client' yang diimpor server
   component berubah menjadi client reference dan tidak bisa dipanggil.
   =========================================================== */
import type { Certificate, JourneyEvent, Profile, ProfileSummary, Project } from '@/lib/types';

/* ---------- baris database ---------- */
export type Row = Record<string, unknown>;

export const PROFILE_COLS =
  'id, catalyst_id, slug, full_name, headline, location, about, avatar_path, avatar_url, channel, journey_stage, cata_points, is_verified, is_public, links, skills, roles, cv_file_name, cv_visibility, created_at, updated_at';
export const SUMMARY_COLS = 'id, slug, full_name, headline, avatar_path, avatar_url, is_verified, journey_stage';

export function toProfile(r: Row): Profile {
  return {
    id: r.id as string,
    catalystId: r.catalyst_id as string,
    slug: r.slug as string,
    fullName: r.full_name as string,
    headline: (r.headline as string) ?? null,
    location: (r.location as string) ?? null,
    about: (r.about as string) ?? null,
    avatarPath: (r.avatar_path as string) ?? null,
    avatarUrl: (r.avatar_url as string) ?? null,
    channel: (r.channel as Profile['channel']) ?? null,
    journeyStage: r.journey_stage as Profile['journeyStage'],
    cataPoints: (r.cata_points as number) ?? 0,
    isVerified: !!r.is_verified,
    isPublic: !!r.is_public,
    links: (r.links as Profile['links']) ?? {},
    skills: (r.skills as string[]) ?? [],
    roles: (r.roles as string[]) ?? [],
    cvFileName: (r.cv_file_name as string) ?? null,
    cvVisibility: (r.cv_visibility as Profile['cvVisibility']) ?? 'private',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function toSummary(r: Row): ProfileSummary {
  return {
    id: r.id as string,
    slug: r.slug as string,
    fullName: r.full_name as string,
    headline: (r.headline as string) ?? null,
    avatarPath: (r.avatar_path as string) ?? null,
    avatarUrl: (r.avatar_url as string) ?? null,
    isVerified: !!r.is_verified,
    journeyStage: r.journey_stage as ProfileSummary['journeyStage'],
  };
}

export function toProject(r: Row): Project {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    description: (r.description as string) ?? null,
    role: (r.role as string) ?? null,
    startedOn: (r.started_on as string) ?? null,
    endedOn: (r.ended_on as string) ?? null,
    url: (r.url as string) ?? null,
    collaborators: (r.collaborators as number) ?? 0,
    createdAt: r.created_at as string,
  };
}

export function toCertificate(r: Row): Certificate {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    source: r.source as Certificate['source'],
    title: r.title as string,
    issuer: r.issuer as string,
    issuedOn: (r.issued_on as string) ?? null,
    credentialId: (r.credential_id as string) ?? null,
    credentialUrl: (r.credential_url as string) ?? null,
    imagePath: (r.image_path as string) ?? null,
    isVerified: !!r.is_verified,
    createdAt: r.created_at as string,
  };
}

export function toJourney(r: Row): JourneyEvent {
  return {
    stage: r.stage as JourneyEvent['stage'],
    title: r.title as string,
    detail: (r.detail as string) ?? null,
    occurredAt: r.occurred_at as string,
  };
}

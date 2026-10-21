/* ===========================================================
   Pemeta baris database ke tipe domain.

   Modul netral: tidak bertanda 'use client' dan tidak 'server-only',
   jadi dipakai bersama oleh SupabaseRepo (browser) dan halaman profil
   publik (server). Fungsi dari modul 'use client' yang diimpor server
   component berubah menjadi client reference dan tidak bisa dipanggil.
   =========================================================== */
import type { Certificate, JourneyClaim, JourneyEvent, Membership, Profile, ProfileSummary, Project } from '@/lib/types';

/* ---------- baris database ---------- */
export type Row = Record<string, unknown>;

export const PROFILE_COLS =
  'id, catalyst_id, slug, full_name, headline, location, about, avatar_path, avatar_url, channel, journey_stage, journey_seen_stage, cata_points, is_verified, is_public, links, skills, roles, cv_file_name, cv_visibility, created_at, updated_at';
export const SUMMARY_COLS =
  'id, slug, full_name, headline, avatar_path, avatar_url, is_verified, journey_stage, channel, cata_points, skills, roles';

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
    journeySeenStage: ((r.journey_seen_stage as Profile['journeySeenStage']) ?? 'explorer'),
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
    channel: (r.channel as ProfileSummary['channel']) ?? null,
    cataPoints: (r.cata_points as number) ?? 0,
    skills: (r.skills as string[]) ?? [],
    roles: (r.roles as string[]) ?? [],
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
    reviewNote: (r.review_note as string) ?? null,
    reviewedAt: (r.reviewed_at as string) ?? null,
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

export const MEMBERSHIP_COLS = 'community_slug, status, proof, review_note, joined_at';

export function toMembership(r: Row): Membership {
  return {
    slug: r.community_slug as string,
    status: (r.status as Membership['status']) ?? 'pending',
    proof: (r.proof as string) ?? null,
    reviewNote: (r.review_note as string) ?? null,
    joinedAt: r.joined_at as string,
  };
}

export const CLAIM_COLS = 'id, kind, detail, url, valuation, status, review_note, created_at';

export function toClaim(r: Row): JourneyClaim {
  return {
    id: r.id as string,
    kind: r.kind as JourneyClaim['kind'],
    detail: r.detail as string,
    url: (r.url as string) ?? null,
    // bigint datang sebagai string atau number tergantung besarnya.
    valuation: r.valuation === null || r.valuation === undefined ? null : Number(r.valuation),
    status: r.status as JourneyClaim['status'],
    reviewNote: (r.review_note as string) ?? null,
    createdAt: r.created_at as string,
  };
}

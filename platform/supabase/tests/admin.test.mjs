// Uji migrasi 0003_admin_dan_penyederhanaan.sql di PGlite.
// Jalankan: npm run test:db
//
// 0001 dan 0002 dipasang lebih dulu dengan data lama, lalu 0003 di atasnya.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const db = new PGlite();
await db.waitReady;

const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];
const val = async (sql, params) => {
  const r = await one(sql, params);
  return r ? Object.values(r)[0] : undefined;
};
async function resetIdentity() {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claims', '', false)`);
}
async function as(uid, fn) {
  const claims = uid ? { sub: uid, role: 'authenticated' } : { role: 'anon' };
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims)]);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try {
    return await fn();
  } finally {
    await resetIdentity();
  }
}
async function signup(meta = {}, email, confirmed = true) {
  const id = randomUUID();
  await db.exec('set role supabase_auth_admin');
  try {
    await db.query(
      'insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values ($1, $2, ($3::text)::jsonb, $4)',
      [id, email ?? `u${id.slice(0, 8)}@example.com`, JSON.stringify(meta), confirmed ? new Date().toISOString() : null],
    );
  } finally {
    await db.exec('reset role');
  }
  return id;
}
const profile = (id) => one('select * from public.profiles where id = $1', [id]);
function eq(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg}: dapat ${JSON.stringify(actual)}, harap ${JSON.stringify(expected)}`);
  }
}
async function rejects(promise, pattern, msg) {
  try {
    await promise;
  } catch (e) {
    if (pattern && !pattern.test(e.message)) throw new Error(`${msg}: galat lain "${e.message}"`);
    return;
  }
  throw new Error(`${msg}: seharusnya ditolak`);
}
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, msg: e.message });
  } finally {
    await resetIdentity();
  }
}

// ------------------------------------------------------------
// Keadaan lama: 0001 + 0002 dengan pemilik sebagai tim lama
// ------------------------------------------------------------
await db.exec(read('./supabase-stub.sql'));
await db.exec('set role sql_editor');
await db.exec(read('../migrations/0001_init.sql'));
await db.exec('reset role');
const pemilik = await signup({ full_name: 'Pemilik' }, 'dbagasputra27@gmail.com');
const lama = await signup({ full_name: 'Anggota Lama' });
await as(lama, () => db.query(`insert into public.community_members (community_slug) values ('aiesec')`));
await as(lama, () => db.query(`insert into public.certificates (title, issuer, credential_id) values ('Lama', 'Penerbit', 'ID-1')`));
await db.exec('set role sql_editor');
await db.exec(read('../migrations/0002_journey_v2.sql'));
await db.exec('reset role');

await test('migrasi 0003 terpasang di atas data lama', async () => {
  await db.exec('set role sql_editor');
  await db.exec(read('../migrations/0003_admin_dan_penyederhanaan.sql'));
});
await resetIdentity();

// ------------------------------------------------------------
// Admin
// ------------------------------------------------------------
await test('tim lama dicabut; hanya alamat admin yang berhak', async () => {
  eq(await as(pemilik, () => val('select public.is_staff()')), false, 'pemilik lama');
});

const admin = await signup({}, 'Info@CatalystSociety.id', false);

await test('akun admin tidak mendapat Passport maupun Catalyst ID', async () => {
  eq(await profile(admin), undefined, 'tanpa profil');
});

await test('admin belum berhak sebelum email terkonfirmasi', async () => {
  eq(await as(admin, () => val('select public.is_staff()')), false, 'belum konfirmasi');
  await db.query('update auth.users set email_confirmed_at = now() where id = $1', [admin]);
  eq(await as(admin, () => val('select public.is_staff()')), true, 'sesudah konfirmasi');
});

await test('pengguna biasa tidak bisa membaca data akun', async () => {
  await rejects(as(lama, () => q('select * from public.admin_users()')), /Hanya tim Catalyst/, 'admin_users');
  await rejects(as(lama, () => q('select * from public.admin_activity(10)')), /Hanya tim Catalyst/, 'admin_activity');
  await rejects(as(null, () => q('select * from public.admin_users()')), /permission denied/, 'anon');
});

await test('admin membaca daftar akun tanpa dirinya sendiri', async () => {
  const rows = await as(admin, () => q('select * from public.admin_users()'));
  eq(rows.length, 2, 'dua anggota');
  eq(Object.keys(rows[0]).sort(), ['created_at', 'email', 'email_confirmed', 'id', 'last_sign_in_at', 'provider'], 'kolom aman saja');
});

await test('admin membaca riwayat poin dan linimasa aktivitas semua pengguna', async () => {
  eq((await as(admin, () => q('select * from public.point_events where user_id = $1', [lama]))).length > 0, true, 'poin orang lain');
  eq((await as(lama, () => q('select * from public.point_events where user_id = $1', [pemilik]))).length, 0, 'bukan admin');
  const akt = await as(admin, () => q('select * from public.admin_activity(50)'));
  eq(akt.some((r) => r.kind === 'komunitas'), true, 'ada aktivitas komunitas');
});

await test('admin melihat profil privat', async () => {
  await as(lama, () => db.query('update public.profiles set is_public = false where id = $1', [lama]));
  eq(await as(admin, () => val('select count(*)::int from public.projects where user_id = $1', [lama])), 0, 'tabel turunan terbaca (kosong)');
  eq(await as(admin, () => val('select count(*)::int from public.profiles where id = $1', [lama])), 1, 'profil privat');
  eq(await as(pemilik, () => val('select count(*)::int from public.profiles where id = $1', [lama])), 0, 'orang lain tidak');
  await as(lama, () => db.query('update public.profiles set is_public = true where id = $1', [lama]));
});

// ------------------------------------------------------------
// Komunitas dan sertifikat
// ------------------------------------------------------------
await test('keanggotaan lama menjadi bebas tanpa pemeriksaan', async () => {
  eq(await val(`select status from public.community_members where user_id = $1`, [lama]), 'verified', 'status');
  eq(await as(null, () => val(`select count(*)::int from public.community_members where user_id = $1`, [lama])), 1, 'terlihat publik');
});

const baru = await signup({ full_name: 'Anggota Baru' });
const teman = [];
for (let i = 0; i < 5; i++) teman.push(await signup({ full_name: `Teman ${i}` }));

await test('bergabung ke komunitas tidak memberi poin', async () => {
  for (const s of ['aico', 'bisa-ai', 'dicoding', 'isp', 'yli']) {
    await as(baru, () => db.query('insert into public.community_members (community_slug) values ($1)', [s]));
  }
  eq((await profile(baru)).cata_points, 10, 'hanya poin daftar');
});

await test('lima komunitas dan lima koneksi langsung membuka Connector', async () => {
  for (const t of teman) await as(baru, () => db.query('insert into public.connections (following_id) values ($1)', [t]));
  const p = await profile(baru);
  eq(p.journey_stage, 'connector', 'tahap');
  eq(p.cata_points, 35, 'daftar 10 + tahap 25');
});

await test('sertifikat dengan ID kredensial langsung terverifikasi, tanpa poin', async () => {
  const sebelum = (await profile(baru)).cata_points;
  await as(baru, () => db.query(`insert into public.certificates (title, issuer, credential_id) values ('Ada ID', 'Penerbit', 'ABC-123')`));
  eq(await val(`select is_verified from public.certificates where title = 'Ada ID'`), true, 'terverifikasi');
  eq((await profile(baru)).cata_points, sebelum, 'poin tetap');
  eq(await val(`select count(*)::int from public.user_badges where user_id = $1 and badge_code = 'certified'`, [baru]), 1, 'lencana');
});

await test('sertifikat tanpa bukti tetap tampil tetapi belum terverifikasi', async () => {
  await as(baru, () => db.query(`insert into public.certificates (title, issuer) values ('Tanpa bukti', 'Penerbit')`));
  eq(await val(`select is_verified from public.certificates where title = 'Tanpa bukti'`), false, 'belum');
  eq(await as(null, () => val(`select count(*)::int from public.certificates where title = 'Tanpa bukti'`)), 1, 'publik');
});

await test('menambah tautan bukti belakangan membuatnya terverifikasi', async () => {
  await as(baru, () => db.query(`update public.certificates set credential_url = 'https://contoh.id/cek' where title = 'Tanpa bukti'`));
  eq(await val(`select is_verified from public.certificates where title = 'Tanpa bukti'`), true, 'terverifikasi');
});

await test('pengguna tidak bisa menyetel is_verified sendiri', async () => {
  await rejects(
    as(baru, () => db.query(`insert into public.certificates (title, issuer, is_verified) values ('Curang', 'X', true)`)),
    /permission denied/,
    'kolom is_verified',
  );
});

await test('sertifikat lama ditandai ulang mengikuti bukti', async () => {
  eq(await val(`select is_verified from public.certificates where title = 'Lama'`), true, 'punya ID kredensial');
});

// ------------------------------------------------------------
// Tautan CV
// ------------------------------------------------------------
await test('tautan CV privat tidak terbaca orang lain', async () => {
  await as(baru, () => db.query(`insert into public.cv_links (url) values ('https://drive.google.com/file/d/abc/view')`));
  eq(await as(lama, () => val(`select count(*)::int from public.cv_links where user_id = $1`, [baru])), 0, 'privat');
  eq(await as(admin, () => val(`select count(*)::int from public.cv_links where user_id = $1`, [baru])), 1, 'admin');
  await as(baru, () => db.query(`update public.profiles set cv_visibility = 'public' where id = $1`, [baru]));
  eq(await as(null, () => val(`select count(*)::int from public.cv_links where user_id = $1`, [baru])), 1, 'publik');
});

await test('tautan CV wajib https', async () => {
  await rejects(
    as(lama, () => db.query(`insert into public.cv_links (url) values ('javascript:alert(1)')`)),
    /check constraint|violates check/,
    'skema berbahaya',
  );
});

// ------------------------------------------------------------
// Masukan
// ------------------------------------------------------------
await test('masukan hanya terbaca pengirim dan admin', async () => {
  await as(baru, () => db.query(`insert into public.feedback (kind, message, page) values ('saran', 'Tambahkan mode gelap untuk kartu', '/passport')`));
  eq(await as(lama, () => val('select count(*)::int from public.feedback')), 0, 'orang lain');
  eq(await as(baru, () => val('select count(*)::int from public.feedback')), 1, 'pengirim');
  eq(await as(admin, () => val('select count(*)::int from public.feedback')), 1, 'admin');
});

await test('hanya admin yang mengubah status masukan', async () => {
  const n = await as(baru, async () => (await db.query(`update public.feedback set status = 'selesai'`)).affectedRows);
  eq(n, 0, 'pengirim tidak bisa');
  await as(admin, () => db.query(`update public.feedback set status = 'dibaca'`));
  eq(await val('select status from public.feedback'), 'dibaca', 'admin bisa');
});

// ------------------------------------------------------------
const gagal = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'GAGAL'} ${r.name}${r.ok ? '' : `\n      ${r.msg}`}`);
console.log(`\n${results.length - gagal.length} lolos, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);

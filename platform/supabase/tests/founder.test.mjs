// Uji migrasi 0005_founder_langsung.sql di PGlite.
// Jalankan: npm run test:db
//
// 0001 sampai 0004 dipasang lebih dulu, lalu 0005 di atasnya.
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

await db.exec(read('./supabase-stub.sql'));
await db.exec('set role sql_editor');
for (const m of ['0001_init', '0002_journey_v2', '0003_admin_dan_penyederhanaan', '0004_kolaborasi']) await db.exec(read(`../migrations/${m}.sql`));
await db.exec('reset role');

const admin = await signup({}, 'info@catalystsociety.id');
const anggota = await signup({ full_name: 'Calon Founder' });

// Klaim disetujui sebelum 0005: tahap masih Explorer.
await as(anggota, () => db.query(`insert into public.journey_claims (kind, detail, valuation) values ('founder', 'Bisnis kopi di Jakarta', 250000000)`));
const klaim = await val(`select id from public.journey_claims where user_id = $1 and kind = 'founder'`, [anggota]);
await as(admin, () => db.query('select public.staff_review_claim($1, true, null)', [klaim]));

await test('sebelum 0005: Founder disetujui tapi tahap tetap Explorer', async () => {
  eq((await one('select journey_stage from public.profiles where id = $1', [anggota])).journey_stage, 'explorer', 'tahap lama');
});

await test('migrasi 0005 terpasang dan memperbaiki anggota yang sudah disetujui', async () => {
  await db.exec('set role sql_editor');
  await db.exec(read('../migrations/0005_founder_langsung.sql'));
  await db.exec('reset role');
  eq((await one('select journey_stage from public.profiles where id = $1', [anggota])).journey_stage, 'founder', 'tahap baru');
});

await test('hanya Explorer dan Founder yang tercatat, tahap di antaranya tidak', async () => {
  const tahap = (await q('select stage from public.journey_events where user_id = $1 order by stage', [anggota])).map((r) => r.stage);
  eq(tahap.includes('founder'), true, 'founder tercatat');
  eq(tahap.some((t) => ['connector', 'challenger', 'innovator', 'contributor', 'builder'].includes(t)), false, 'tanpa tahap tengah');
});

await test('poin Founder dan lencana Founder diberikan sekali', async () => {
  await db.query('select private.recompute_journey($1)', [anggota]);
  eq(await val(`select count(*)::int from public.point_events where user_id = $1 and reason = 'stage:founder'`, [anggota]), 1, 'poin sekali');
  eq(await val(`select count(*)::int from public.user_badges where user_id = $1 and badge_code = 'founder'`, [anggota]), 1, 'lencana');
});

await test('klaim Founder baru yang disetujui langsung menaikkan tahap', async () => {
  const lain = await signup({ full_name: 'Founder Kedua' });
  await as(lain, () => db.query(`insert into public.journey_claims (kind, detail, valuation) values ('founder', 'Studio desain', 400000000)`));
  const id = await val(`select id from public.journey_claims where user_id = $1`, [lain]);
  await as(admin, () => db.query('select public.staff_review_claim($1, true, null)', [id]));
  eq((await one('select journey_stage from public.profiles where id = $1', [lain])).journey_stage, 'founder', 'langsung founder');
});

await test('klaim Founder yang ditolak tidak mengubah tahap', async () => {
  const lain = await signup({ full_name: 'Ditolak' });
  await as(lain, () => db.query(`insert into public.journey_claims (kind, detail, valuation) values ('founder', 'Usaha kecil', 150000000)`));
  const id = await val(`select id from public.journey_claims where user_id = $1`, [lain]);
  await as(admin, () => db.query('select public.staff_review_claim($1, false, $2)', [id, 'Bukti valuasi belum ada']));
  eq((await one('select journey_stage from public.profiles where id = $1', [lain])).journey_stage, 'explorer', 'tetap explorer');
});

// ------------------------------------------------------------
const gagal = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'GAGAL'} ${r.name}${r.ok ? '' : `\n      ${r.msg}`}`);
console.log(`\n${results.length - gagal.length} lolos, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);

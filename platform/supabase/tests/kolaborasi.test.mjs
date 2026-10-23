// Uji migrasi 0004_kolaborasi.sql di PGlite.
// Jalankan: npm run test:db
//
// 0001 sampai 0003 dipasang lebih dulu, lalu 0004 di atasnya.
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
for (const m of ['0001_init', '0002_journey_v2', '0003_admin_dan_penyederhanaan']) await db.exec(read(`../migrations/${m}.sql`));
await db.exec('reset role');

await test('migrasi 0004 terpasang', async () => {
  await db.exec('set role sql_editor');
  await db.exec(read('../migrations/0004_kolaborasi.sql'));
});
await resetIdentity();

const admin = await signup({}, 'info@catalystsociety.id');
const anggota = await signup({ full_name: 'Anggota' });
const isi = (lain = {}) => JSON.stringify({
  full_name: 'Rina Wijaya', job_title: 'Head of CSR', email: 'rina@contoh.co.id', phone: '0812 1111 2222',
  organization: 'PT Contoh', org_type: 'Korporasi', kinds: ['Corporate Partnership', 'Sponsorship', 'Sponsorship'],
  industries: ['ai'], budget: 'Rp50-200 juta', timeline: '1-3 bulan', contact_pref: 'Email',
  message: 'Kami ingin mensponsori Catalyst Summit tahun depan.', ...lain,
});
const kirim = (uid, lain) => as(uid, () => val('select public.submit_collaboration($1::jsonb)', [isi(lain)]));

await test('tamu mengirim dan mendapat nomor referensi', async () => {
  const ref = await kirim(null);
  if (!/^KOL-\d{4}-\d{4}$/.test(ref)) throw new Error(`nomor referensi aneh: ${ref}`);
  const r = await one('select * from public.collaboration_requests where ref_no = $1', [ref]);
  eq(r.status, 'baru', 'status awal');
  eq(r.kinds.length, 2, 'jenis tanpa duplikat');
  eq(r.user_id, null, 'tamu tanpa user_id');
});

await test('anggota yang masuk tercatat sebagai pengirim', async () => {
  const ref = await kirim(anggota, { email: 'anggota@contoh.id' });
  eq(await val('select user_id from public.collaboration_requests where ref_no = $1', [ref]), anggota, 'user_id');
});

await test('isian wajib dan jebakan bot ditolak', async () => {
  await rejects(kirim(null, { email: 'a@b.id', full_name: '' }), /full_name|null/, 'tanpa nama');
  await rejects(kirim(null, { email: 'a@b.id', kinds: [] }), /check|kinds/i, 'tanpa jenis');
  await rejects(kirim(null, { email: 'bukan-email' }), /check|email/i, 'email salah');
  await rejects(kirim(null, { email: 'a@b.id', message: 'pendek' }), /check|message/i, 'pesan pendek');
  await rejects(kirim(null, { email: 'a@b.id', situs_web: 'http://spam' }), /ditolak/, 'jebakan bot');
});

await test('lebih dari tiga kiriman per 10 menit ditolak', async () => {
  for (let i = 0; i < 3; i++) await kirim(null, { email: 'banjir@contoh.id' });
  await rejects(kirim(null, { email: 'Banjir@Contoh.id' }), /Terlalu banyak/, 'kiriman keempat');
});

await test('tamu dan anggota tidak bisa menulis atau membaca langsung', async () => {
  await rejects(as(null, () => db.query(`insert into public.collaboration_requests (ref_no, full_name, email, kinds, message) values ('X', 'Ab', 'a@b.id', '{x}', 'pesan panjang sekali')`)), /permission|denied/i, 'insert tamu');
  await rejects(as(null, () => db.query('select * from public.collaboration_requests')), /permission|denied/i, 'baca tamu');
  eq(await as(anggota, () => val('select count(*)::int from public.collaboration_requests')), 0, 'anggota tidak melihat apa pun');
});

await test('admin membaca semua dan menindaklanjuti', async () => {
  const n = await as(admin, () => val('select count(*)::int from public.collaboration_requests'));
  if (n < 5) throw new Error(`admin hanya melihat ${n}`);
  await as(admin, () => db.query(`update public.collaboration_requests set status = 'dihubungi', admin_note = 'Telepon Senin'`));
  eq(await val(`select count(*)::int from public.collaboration_requests where status = 'dihubungi'`), n, 'status berubah');
  await rejects(as(admin, () => db.query(`update public.collaboration_requests set email = 'x@y.id'`)), /permission|denied/i, 'kolom lain terkunci');
  const m = await as(anggota, async () => (await db.query(`update public.collaboration_requests set status = 'ditolak'`)).affectedRows);
  eq(m, 0, 'anggota tidak bisa');
});

// ------------------------------------------------------------
const gagal = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'GAGAL'} ${r.name}${r.ok ? '' : `\n      ${r.msg}`}`);
console.log(`\n${results.length - gagal.length} lolos, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);

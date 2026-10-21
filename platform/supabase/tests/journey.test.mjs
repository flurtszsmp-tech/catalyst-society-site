// Uji migrasi 0002_journey_v2.sql di PGlite (Postgres di WASM).
// Jalankan: npm run test:db
//
// 0001 dipasang lebih dulu dan diisi pengguna lama, supaya penataan ulang
// data di 0002 ikut teruji, bukan hanya database kosong.
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
async function signup(meta = {}, email) {
  const id = randomUUID();
  await db.exec('set role supabase_auth_admin');
  try {
    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, ($3::text)::jsonb)', [
      id,
      email ?? `u${id.slice(0, 8)}@example.com`,
      JSON.stringify(meta),
    ]);
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
// Keadaan lama: 0001 dengan dua pengguna yang sudah beraktivitas
// ------------------------------------------------------------
await db.exec(read('./supabase-stub.sql'));
await db.exec('set role sql_editor');
await db.exec(read('../migrations/0001_init.sql'));
await db.exec('reset role');

const OWNER_EMAIL = 'dbagasputra27@gmail.com';
const lama1 = await signup({ full_name: 'Pengguna Lama Satu' }, OWNER_EMAIL);
const lama2 = await signup({ full_name: 'Pengguna Lama Dua' });
// Slug kustom milik pengguna kedua tidak boleh berubah.
await as(lama2, () => db.query(`update public.profiles set slug = 'lama-dua' where id = $1`, [lama2]));
for (const slug of ['aiesec', 'gensmart', 'yot']) {
  await as(lama1, () => db.query('insert into public.community_members (community_slug) values ($1)', [slug]));
}
await as(lama1, () => db.query(`insert into public.projects (title) values ('Projek lama')`));
const poinLama = (await profile(lama1)).cata_points;

await test('migrasi 0002 terpasang di atas data lama (peran non-superuser)', async () => {
  await db.exec('set role sql_editor');
  await db.exec(read('../migrations/0002_journey_v2.sql'));
});
await resetIdentity();

// ------------------------------------------------------------
// Penataan ulang data lama
// ------------------------------------------------------------
await test('Catalyst ID lama dinomori ulang menurut urutan daftar', async () => {
  eq((await profile(lama1)).catalyst_id, 'CP-00001', 'pengguna pertama');
  eq((await profile(lama2)).catalyst_id, 'CP-00002', 'pengguna kedua');
});

await test('alamat profil bawaan ikut diganti, alamat kustom tidak', async () => {
  eq((await profile(lama1)).slug, 'cp-00001', 'slug bawaan');
  eq((await profile(lama2)).slug, 'lama-dua', 'slug kustom');
});

await test('poin lama dihitung ulang dengan aturan baru', async () => {
  const p = await profile(lama1);
  // 10 daftar + 15 projek pertama. Komunitas belum terverifikasi: 0.
  eq(p.cata_points, 25, `poin baru (sebelumnya ${poinLama})`);
  eq(p.journey_stage, 'explorer', 'tahap kembali ke explorer');
});

await test('keanggotaan lama masuk antrean verifikasi', async () => {
  eq(await val(`select count(*)::int from public.community_members where user_id = $1 and status = 'pending'`, [lama1]), 3, 'tiga menunggu');
});

await test('pemilik terdaftar sebagai tim, pengguna lain tidak', async () => {
  eq(await as(lama1, () => val('select public.is_staff()')), true, 'pemilik');
  eq(await as(lama2, () => val('select public.is_staff()')), false, 'pengguna biasa');
});

// ------------------------------------------------------------
// Pengguna baru
// ------------------------------------------------------------
const baru = await signup({ full_name: 'Pengguna Baru', channel: 'ai' });

await test('pengguna baru mendapat nomor berikutnya', async () => {
  const p = await profile(baru);
  eq(p.catalyst_id, 'CP-00003', 'nomor');
  eq(p.slug, 'cp-00003', 'slug');
  eq(p.channel, 'ai', 'channel dari formulir');
  eq(p.cata_points, 10, 'poin daftar');
});

await test('format nomor di atas 99.999 tidak terpotong', async () => {
  eq(await val(`select private.format_catalyst_id(123456)`), 'CP-123456', 'enam digit');
  eq(await val(`select private.format_catalyst_id(7)`), 'CP-00007', 'satu digit');
});

// ------------------------------------------------------------
// Anti manipulasi
// ------------------------------------------------------------
await test('bergabung ke komunitas tidak memberi poin sebelum diverifikasi', async () => {
  for (const s of ['aico', 'bisa-ai', 'dicoding', 'isp', 'yli']) {
    await as(baru, () => db.query('insert into public.community_members (community_slug, proof) values ($1, $2)', [s, '@pengguna']));
  }
  eq((await profile(baru)).cata_points, 10, 'poin tetap');
});

await test('pengguna tidak bisa menyetel status keanggotaannya sendiri', async () => {
  await rejects(
    as(baru, () => db.query(`insert into public.community_members (community_slug, status) values ('mekari', 'verified')`)),
    /permission denied/,
    'insert status',
  );
  await rejects(
    as(baru, () => db.query(`update public.community_members set status = 'verified' where user_id = $1`, [baru])),
    /permission denied/,
    'update status',
  );
});

await test('pengguna biasa tidak bisa memanggil fungsi pemeriksaan', async () => {
  await rejects(
    as(baru, () => db.query(`select public.staff_review_membership($1, 'aico', true)`, [baru])),
    /Hanya tim Catalyst/,
    'review sendiri',
  );
});

await test('fungsi poin tidak terjangkau dari API', async () => {
  await rejects(as(baru, () => db.query(`select private.give_points($1, 'x', 999)`, [baru])), /permission denied/, 'give_points');
});

await test('pengunjung tidak melihat keanggotaan yang belum terverifikasi', async () => {
  eq(await as(null, () => val(`select count(*)::int from public.community_members where user_id = $1`, [baru])), 0, 'anon');
  eq(await as(baru, () => val(`select count(*)::int from public.community_members where user_id = $1`, [baru])), 5, 'pemilik');
});

await test('mengikuti orang tidak memberi poin', async () => {
  const sebelum = (await profile(baru)).cata_points;
  await as(baru, () => db.query('insert into public.connections (following_id) values ($1)', [lama1]));
  eq((await profile(baru)).cata_points, sebelum, 'poin tetap');
});

// ------------------------------------------------------------
// Journey berurutan
// ------------------------------------------------------------
const lain = [];
for (let i = 0; i < 5; i++) lain.push(await signup({ full_name: `Teman ${i}` }));

await test('Connector: lima komunitas terverifikasi dan lima koneksi', async () => {
  for (const s of ['aico', 'bisa-ai', 'dicoding', 'isp']) {
    await as(lama1, () => db.query(`select public.staff_review_membership($1, $2, true, null)`, [baru, s]));
  }
  // Empat komunitas: belum.
  for (const t of lain.slice(0, 4)) await as(baru, () => db.query('insert into public.connections (following_id) values ($1)', [t]));
  eq((await profile(baru)).journey_stage, 'explorer', 'empat komunitas, lima koneksi');
  await as(lama1, () => db.query(`select public.staff_review_membership($1, 'yli', true, null)`, [baru]));
  eq((await profile(baru)).journey_stage, 'connector', 'lima komunitas, lima koneksi');
  // 10 + 5x5 komunitas + 25 tahap connector
  eq((await profile(baru)).cata_points, 60, 'poin');
});

await test('lencana komunitas mengikuti keanggotaan terverifikasi', async () => {
  const kode = (await q('select badge_code from public.user_badges where user_id = $1 order by 1', [baru])).map((r) => r.badge_code);
  // aico, bisa-ai, dicoding (ai), isp (investments), yli (impact): tiga channel.
  eq(kode, ['community_explorer', 'ecosystem_native', 'first_community', 'first_step'], 'lencana');
});

await test('keluar lalu bergabung lagi tidak memberi poin kedua kalinya', async () => {
  await as(baru, () => db.query(`delete from public.community_members where user_id = $1 and community_slug = 'aico'`, [baru]));
  await as(baru, () => db.query(`insert into public.community_members (community_slug) values ('aico')`));
  await as(lama1, () => db.query(`select public.staff_review_membership($1, 'aico', true, null)`, [baru]));
  eq((await profile(baru)).cata_points, 60, 'poin tetap');
});

await test('tahap tidak turun saat syaratnya hilang', async () => {
  await as(baru, () => db.query(`delete from public.connections where follower_id = $1`, [baru]));
  eq((await profile(baru)).journey_stage, 'connector', 'tetap connector');
  for (const t of lain) await as(baru, () => db.query('insert into public.connections (following_id) values ($1)', [t]));
});

await test('Challenger butuh sertifikat dan bootcamp terverifikasi', async () => {
  await as(baru, () => db.query(`insert into public.certificates (title, issuer) values ('Sertifikat', 'Penerbit')`));
  eq((await profile(baru)).journey_stage, 'connector', 'sertifikat saja belum cukup');
  await as(baru, () =>
    db.query(`insert into public.journey_claims (kind, detail) values ('bootcamp', 'Menuntaskan sesi bootcamp AI batch 3')`),
  );
  const klaim = await val(`select id from public.journey_claims where user_id = $1 and kind = 'bootcamp'`, [baru]);
  await as(lama1, () => db.query(`select public.staff_review_claim($1, true, null)`, [klaim]));
  eq((await profile(baru)).journey_stage, 'challenger', 'challenger');
});

await test('pengguna tidak bisa menyetujui klaimnya sendiri', async () => {
  await rejects(
    as(baru, () => db.query(`insert into public.journey_claims (kind, detail, status) values ('labs', 'Membangun projek', 'approved')`)),
    /permission denied/,
    'status klaim',
  );
});

await test('Innovator: projek pertama sesudah Challenger', async () => {
  await as(baru, () => db.query(`insert into public.projects (title) values ('Projek baru')`));
  eq((await profile(baru)).journey_stage, 'innovator', 'innovator');
});

await test('klaim Founder wajib valuasi di atas Rp100 juta', async () => {
  await rejects(
    as(baru, () =>
      db.query(`insert into public.journey_claims (kind, detail, valuation) values ('founder', 'Bisnis kopi di Jakarta', 50000000)`),
    ),
    /check constraint|violates check/,
    'valuasi kecil',
  );
});

await test('Founder hanya sesudah Contributor dan Builder', async () => {
  await as(baru, () =>
    db.query(`insert into public.journey_claims (kind, detail, valuation) values ('founder', 'Bisnis kopi di Jakarta', 250000000)`),
  );
  const f = await val(`select id from public.journey_claims where user_id = $1 and kind = 'founder'`, [baru]);
  await as(lama1, () => db.query(`select public.staff_review_claim($1, true, null)`, [f]));
  eq((await profile(baru)).journey_stage, 'innovator', 'founder disetujui tapi tahap sebelumnya belum');
  for (const kind of ['finder', 'labs']) {
    await as(baru, () => db.query(`insert into public.journey_claims (kind, detail) values ($1, 'Bukti kontribusi projek')`, [kind]));
    const id = await val(`select id from public.journey_claims where user_id = $1 and kind = $2`, [baru, kind]);
    await as(lama1, () => db.query(`select public.staff_review_claim($1, true, null)`, [id]));
  }
  const p = await profile(baru);
  eq(p.journey_stage, 'founder', 'founder');
  const tahap = (await q('select stage from public.journey_events where user_id = $1 order by occurred_at, id', [baru])).map((r) => r.stage);
  eq(tahap.length, 7, 'tujuh tahap tercatat');
  const kode = (await q(`select badge_code from public.user_badges where user_id = $1 and badge_code in ('builder','founder') order by 1`, [baru])).map((r) => r.badge_code);
  eq(kode, ['builder', 'founder'], 'lencana builder dan founder');
});

await test('sertifikat terverifikasi memberi poin dan lencana sekali', async () => {
  const c = await val(`select id from public.certificates where user_id = $1`, [baru]);
  const sebelum = (await profile(baru)).cata_points;
  await as(lama1, () => db.query(`select public.staff_review_certificate($1, true, null)`, [c]));
  await as(lama1, () => db.query(`select public.staff_review_certificate($1, true, null)`, [c]));
  eq((await profile(baru)).cata_points, sebelum + 25, 'poin sekali');
  eq(await val(`select count(*)::int from public.user_badges where user_id = $1 and badge_code = 'certified'`, [baru]), 1, 'lencana');
});

await test('sertifikat terverifikasi tidak bisa diubah pemiliknya', async () => {
  const c = await val(`select id from public.certificates where user_id = $1`, [baru]);
  const n = await as(baru, async () => (await db.query(`update public.certificates set title = 'Diganti' where id = $1`, [c])).affectedRows);
  eq(n, 0, 'tidak ada baris berubah');
});

await test('sertifikat yang ditolak lalu diperbaiki kembali ke antrean', async () => {
  await as(baru, () => db.query(`insert into public.certificates (title, issuer) values ('Kedua', 'Penerbit')`));
  const c = await val(`select id from public.certificates where user_id = $1 and title = 'Kedua'`, [baru]);
  await as(lama1, () => db.query(`select public.staff_review_certificate($1, false, 'Gambar buram')`, [c]));
  eq(await val(`select review_note from public.certificates where id = $1`, [c]), 'Gambar buram', 'catatan');
  await as(baru, () => db.query(`update public.certificates set title = 'Kedua (diperbaiki)' where id = $1`, [c]));
  eq(await val(`select reviewed_at is null from public.certificates where id = $1`, [c]), true, 'masuk antrean');
});

await test('journey_seen_stage boleh diubah pemilik, journey_stage tidak', async () => {
  await as(baru, () => db.query(`update public.profiles set journey_seen_stage = 'founder' where id = $1`, [baru]));
  eq((await profile(baru)).journey_seen_stage, 'founder', 'seen');
  await rejects(
    as(baru, () => db.query(`update public.profiles set journey_stage = 'founder' where id = $1`, [baru])),
    /permission denied/,
    'stage',
  );
});

await test('klaim orang lain tidak terbaca', async () => {
  eq(await as(lama2, () => val(`select count(*)::int from public.journey_claims where user_id = $1`, [baru])), 0, 'pengguna lain');
  eq(await as(lama1, () => val(`select count(*)::int from public.journey_claims where user_id = $1`, [baru])), 4, 'tim');
});

// ------------------------------------------------------------
const gagal = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'GAGAL'} ${r.name}${r.ok ? '' : `\n      ${r.msg}`}`);
console.log(`\n${results.length - gagal.length} lolos, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);

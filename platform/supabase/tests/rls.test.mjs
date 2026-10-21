// Uji keamanan supabase/migrations/0001_init.sql di PGlite (Postgres di WASM).
// Jalankan: npm run test:db
//
// Migrasi dijalankan apa adanya di atas supabase-stub.sql. Identitas
// ditukar seperti PostgREST: SET ROLE + request.jwt.claims. Setiap uji
// membuat pengguna sendiri supaya urutan uji tidak saling memengaruhi.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const db = new PGlite();
await db.waitReady;

// ------------------------------------------------------------
// Pembantu
// ------------------------------------------------------------
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];
const val = async (sql, params) => {
  const r = await one(sql, params);
  return r ? Object.values(r)[0] : undefined;
};
const affected = async (sql, params = []) => (await db.query(sql, params)).affectedRows ?? 0;

async function resetIdentity() {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claims', '', false)`);
}

// uid null berarti pengunjung tanpa login (anon).
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
const anon = (fn) => as(null, fn);

// GoTrue menulis auth.users sebagai supabase_auth_admin; trigger
// pendaftaran harus jalan dengan peran itu, bukan superuser.
async function signup({ meta = {}, email, id = randomUUID() } = {}) {
  await db.exec('set role supabase_auth_admin');
  try {
    await db.query(
      'insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, ($3::text)::jsonb)',
      [id, email ?? `u${id.slice(0, 8)}@example.com`, JSON.stringify(meta)],
    );
  } finally {
    await db.exec('reset role');
  }
  return id;
}

const profile = (id) => one('select * from public.profiles where id = $1', [id]);
const points = (id) => val('select cata_points from public.profiles where id = $1', [id]);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
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
const DENIED = /permission denied/;
const RLS = /row-level security/;
const CHECK = /check constraint|violates check/;

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
// Pemasangan
// ------------------------------------------------------------
await db.exec(read('./supabase-stub.sql'));

await test('stub: hak bawaan ala Supabase aktif (tabel baru di public terbuka untuk anon)', async () => {
  await db.exec('set role sql_editor; create table public.zz_probe (x int); reset role');
  const ok = await val(`select has_table_privilege('anon', 'public.zz_probe', 'INSERT')`);
  await db.exec('drop table public.zz_probe');
  eq(ok, true, 'anon punya INSERT bawaan');
});

let migrated = false;
await test('migrasi 0001_init.sql terpasang tanpa galat (sebagai peran non-superuser)', async () => {
  await db.exec('set role sql_editor');
  await db.exec(read('../migrations/0001_init.sql'));
  migrated = true;
});

if (migrated) await runSuite();
report();

// ============================================================
async function runSuite() {
  // ---------------- Pendaftaran ----------------
  await test('signup: catalyst_id CAT-XXXXXX, slug = huruf kecilnya', async () => {
    const id = await signup({ meta: { full_name: 'Budi Santoso' } });
    const p = await profile(id);
    assert(/^CAT-[0-9A-F]{6}$/.test(p.catalyst_id), `catalyst_id ${p.catalyst_id}`);
    eq(p.slug, p.catalyst_id.toLowerCase(), 'slug');
    eq(p.full_name, 'Budi Santoso', 'full_name');
  });

  await test('signup: 50 poin, lencana first_step, journey explorer', async () => {
    const id = await signup();
    const p = await profile(id);
    eq(p.cata_points, 50, 'cata_points');
    eq(p.journey_stage, 'explorer', 'journey_stage');
    eq(p.is_verified, false, 'is_verified');
    eq(await val('select array_agg(badge_code) from public.user_badges where user_id = $1', [id]), ['first_step'], 'lencana');
    eq(await val('select array_agg(stage) from public.journey_events where user_id = $1', [id]), ['explorer'], 'journey');
    eq(await q('select reason, delta from public.point_events where user_id = $1', [id]), [{ reason: 'signup', delta: 50 }], 'point_events');
  });

  await test('signup: metadata Google (name, picture) mengisi full_name dan avatar_url', async () => {
    const pic = 'https://lh3.googleusercontent.com/a/ACg8ocK';
    const id = await signup({ meta: { name: 'Sari Google', picture: pic, email_verified: true } });
    const p = await profile(id);
    eq(p.full_name, 'Sari Google', 'full_name');
    eq(p.avatar_url, pic, 'avatar_url');
  });

  await test('signup: avatar javascript: dibuang, profil tetap dibuat', async () => {
    const id = await signup({ meta: { full_name: 'Jahil', avatar_url: 'javascript:alert(1)' } });
    const p = await profile(id);
    assert(p, 'profil tidak dibuat');
    eq(p.avatar_url, null, 'avatar_url');
  });

  await test('signup: avatar dari host selain foto Google dibuang', async () => {
    const id = await signup({ meta: { full_name: 'Pelacak', avatar_url: 'https://tracker.example/p.gif?u=1' } });
    eq((await profile(id)).avatar_url, null, 'avatar_url');
  });

  await test('kolom: avatar_url hanya foto Google, cv_file_name harus .pdf', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`update public.profiles set avatar_url = 'https://tracker.example/p.gif' where id = $1`, [id]), CHECK, 'avatar_url host lain');
      await rejects(q(`update public.profiles set cv_file_name = 'CV.hta' where id = $1`, [id]), CHECK, 'cv .hta');
      await rejects(q(`update public.profiles set cv_file_name = '../x.pdf' where id = $1`, [id]), CHECK, 'cv dengan garis miring');
      eq(await affected(`update public.profiles set cv_file_name = 'CV Andi.PDF' where id = $1`, [id]), 1, 'cv .PDF');
    });
  });

  await test('signup: tanpa nama memakai bagian depan email', async () => {
    const id = await signup({ email: 'dewi.lestari@example.com' });
    eq((await profile(id)).full_name, 'dewi.lestari', 'full_name');
  });

  // Tabrakan dipaksa dengan trigger uji yang mengganti catalyst_id ke kode
  // yang sudah dipakai, sehingga unique index sungguhan yang menolak.
  const victim = await signup();
  await db.exec(`
    update public.profiles set catalyst_id = 'CAT-TAKEN0' where id = '${victim}';
    create schema test;
    create sequence test.attempts;
    create function test.force_collision() returns trigger
    language plpgsql security definer as $$
    begin
      if nextval('test.attempts') <= coalesce(nullif(current_setting('test.collide_until', true), ''), '0')::int then
        new.catalyst_id := 'CAT-TAKEN0';
      end if;
      return new;
    end $$;
    create trigger aa_force_collision before insert on public.profiles
      for each row execute function test.force_collision();
  `);
  const collide = async (n) => {
    await db.query(`select setval('test.attempts', 1, false), set_config('test.collide_until', $1, false)`, [String(n)]);
  };

  await test('signup: tabrakan catalyst_id diulang dengan kode baru (3 tabrakan)', async () => {
    await collide(3);
    const id = await signup();
    const p = await profile(id);
    eq(await val('select last_value from test.attempts'), 4, 'jumlah percobaan');
    assert(/^CAT-[0-9A-F]{6}$/.test(p.catalyst_id) && p.catalyst_id !== 'CAT-TAKEN0', `catalyst_id ${p.catalyst_id}`);
    eq(p.cata_points, 50, 'hadiah tetap sekali');
  });

  await test('signup: setelah 25 tabrakan memakai UUID penuh', async () => {
    await collide(25);
    const id = await signup();
    const p = await profile(id);
    eq(p.catalyst_id, 'CAT-' + id.replaceAll('-', '').toUpperCase(), 'catalyst_id cadangan');
    eq(p.slug, p.catalyst_id.toLowerCase(), 'slug cadangan lolos pola slug');
  });

  await test('signup: tabrakan terus-menerus menggagalkan pendaftaran utuh (tanpa user yatim)', async () => {
    await collide(1000);
    const id = randomUUID();
    await rejects(signup({ id }), /duplicate key|unique/, 'pendaftaran');
    eq(await val('select count(*)::int from auth.users where id = $1', [id]), 0, 'auth.users');
  });

  await collide(0);
  await db.exec('drop trigger aa_force_collision on public.profiles; drop schema test cascade');

  // ---------------- Hak kolom profil ----------------
  for (const [col, v] of [
    ['is_verified', 'true'],
    ['cata_points', '99999'],
    ['journey_stage', `'innovator'`],
    ['catalyst_id', `'CAT-AAAAAA'`],
    ['id', 'gen_random_uuid()'],
  ]) {
    await test(`kolom: pengguna tidak bisa mengubah ${col} miliknya`, async () => {
      const id = await signup();
      const before = await profile(id);
      await as(id, () => rejects(q(`update public.profiles set ${col} = ${v} where id = $1`, [id]), DENIED, col));
      eq((await profile(id))[col], before[col], `${col} tetap`);
    });
  }

  await test('kolom: bisa mengubah full_name, headline, about, skills, links, is_public, slug, cv_visibility (dan kolom isian lain)', async () => {
    const id = await signup();
    const slug = 'budi-' + id.slice(0, 6);
    const n = await as(id, () =>
      affected(
        `update public.profiles set full_name = 'Nama Baru', headline = 'Builder', about = 'Tentang saya',
           location = 'Bandung', channel = 'ai', skills = array['sql','rls'], roles = array['mentor'],
           links = '{"github":"https://github.com/budi"}', is_public = false, slug = $2,
           cv_visibility = 'public', cv_file_name = 'cv.pdf', avatar_path = $3,
           avatar_url = 'https://lh3.googleusercontent.com/a/x'
         where id = $1`,
        [id, slug, `${id}/avatar.png`],
      ),
    );
    eq(n, 1, 'baris terubah');
    const p = await profile(id);
    eq([p.full_name, p.headline, p.about, p.slug, p.is_public, p.cv_visibility, p.skills, p.links],
      ['Nama Baru', 'Builder', 'Tentang saya', slug, false, 'public', ['sql', 'rls'], { github: 'https://github.com/budi' }], 'nilai');
  });

  await test('kolom: tidak ada INSERT atau DELETE profil dari browser', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`insert into public.profiles (id, catalyst_id, slug, full_name) values (gen_random_uuid(), 'CAT-ZZZZZZ', 'cat-zzzzzz', 'x')`), DENIED, 'insert');
      await rejects(q('delete from public.profiles where id = $1', [id]), DENIED, 'delete');
    });
  });

  await test('kolom: slug huruf besar atau terlalu pendek ditolak', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`update public.profiles set slug = 'Budi' where id = $1`, [id]), CHECK, 'huruf besar');
      await rejects(q(`update public.profiles set slug = 'ab' where id = $1`, [id]), CHECK, 'pendek');
    });
  });

  // ---------------- Tautan dan URL ----------------
  const setLinks = (id, links) =>
    as(id, () => q(`update public.profiles set links = ($2::text)::jsonb where id = $1`, [id, JSON.stringify(links)]));
  const tooMany = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`k${i}`, 'https://example.com']));
  for (const [label, links] of [
    ['javascript:', { website: 'javascript:alert(1)' }],
    ['JavaScript: huruf campur', { website: 'JaVaScRiPt:alert(1)' }],
    ['data:', { website: 'data:text/html,<script>alert(1)</script>' }],
    ['kunci tak dikenal', { myspace: 'https://myspace.com/x' }],
    ['lebih dari 12 kunci', tooMany],
    ['nilai bukan string', { github: { url: 'https://github.com' } }],
    ['bukan objek', ['https://github.com']],
  ]) {
    await test(`links: ${label} ditolak`, async () => {
      const id = await signup();
      await rejects(setLinks(id, links), CHECK, label);
    });
  }

  await test('links: https dan http diterima', async () => {
    const id = await signup();
    await setLinks(id, { github: 'https://github.com/x', website: 'http://contoh.id' });
    eq((await profile(id)).links, { github: 'https://github.com/x', website: 'http://contoh.id' }, 'links');
  });

  await test('url: avatar_url, projects.url, credential_url tidak menerima javascript:/data:', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`update public.profiles set avatar_url = 'javascript:alert(1)' where id = $1`, [id]), CHECK, 'avatar_url');
      await rejects(q(`insert into public.projects (title, url) values ('P', 'javascript:alert(1)')`), CHECK, 'projects.url');
      await rejects(q(`insert into public.certificates (title, issuer, credential_url) values ('S', 'X', 'data:text/html,x')`), CHECK, 'credential_url');
    });
  });

  await test('path: avatar_path dan image_path hanya boleh di folder milik sendiri', async () => {
    const id = await signup();
    const lain = await signup();
    await as(id, async () => {
      await rejects(q(`update public.profiles set avatar_path = $2 where id = $1`, [id, `${lain}/avatar.png`]), CHECK, 'avatar orang lain');
      await rejects(q(`update public.profiles set avatar_path = $2 where id = $1`, [id, `${id}/../${lain}/a.png`]), CHECK, 'avatar dengan ..');
      await rejects(q(`update public.profiles set avatar_path = 'avatar.png' where id = $1`, [id]), CHECK, 'avatar tanpa folder');
      eq(await affected(`update public.profiles set avatar_path = $2 where id = $1`, [id, `${id}/avatar-1.webp`]), 1, 'avatar sendiri');
      await rejects(q(`insert into public.certificates (title, issuer, image_path) values ('S', 'X', $1)`, [`${lain}/c.png`]), CHECK, 'gambar sertifikat orang lain');
      eq(await affected(`insert into public.certificates (title, issuer, image_path) values ('S', 'X', $1)`, [`${id}/1-ab.png`]), 1, 'gambar sertifikat sendiri');
    });
  });

  // ---------------- Isolasi antar pengguna ----------------
  await test('isolasi: A tidak bisa mengubah atau menghapus profil B', async () => {
    const a = await signup();
    const b = await signup({ meta: { full_name: 'Bima' } });
    const n = await as(a, () => affected(`update public.profiles set full_name = 'Diretas' where id = $1`, [b]));
    eq(n, 0, 'baris terubah');
    eq((await profile(b)).full_name, 'Bima', 'nama B');
    await as(a, () => rejects(q('delete from public.profiles where id = $1', [b]), DENIED, 'delete'));
  });

  await test('isolasi: A tidak bisa mengubah, menghapus, atau membuat projek B', async () => {
    const a = await signup();
    const b = await signup();
    const pid = await as(b, () => val(`insert into public.projects (title) values ('Milik B') returning id`));
    await as(a, async () => {
      eq(await affected(`update public.projects set title = 'Diretas' where id = $1`, [pid]), 0, 'update');
      eq(await affected('delete from public.projects where id = $1', [pid]), 0, 'delete');
      await rejects(q(`insert into public.projects (user_id, title) values ($1, 'Palsu')`, [b]), DENIED, 'insert atas nama B');
      await rejects(q(`update public.projects set user_id = $1 where user_id = $1`, [a]), DENIED, 'pindah pemilik');
    });
    eq(await val('select title from public.projects where id = $1', [pid]), 'Milik B', 'judul');
  });

  await test('isolasi: A tidak bisa mengubah, menghapus, atau membuat sertifikat B', async () => {
    const a = await signup();
    const b = await signup();
    const cid = await as(b, () => val(`insert into public.certificates (title, issuer) values ('Milik B', 'X') returning id`));
    await as(a, async () => {
      eq(await affected(`update public.certificates set title = 'Diretas' where id = $1`, [cid]), 0, 'update');
      eq(await affected('delete from public.certificates where id = $1', [cid]), 0, 'delete');
      await rejects(q(`insert into public.certificates (user_id, title, issuer) values ($1, 'Palsu', 'X')`, [b]), DENIED, 'insert atas nama B');
    });
    eq(await val('select title from public.certificates where id = $1', [cid]), 'Milik B', 'judul');
  });

  await test('isolasi: A tidak bisa menghapus atau membuat keanggotaan B', async () => {
    const a = await signup();
    const b = await signup();
    await as(b, () => q(`insert into public.community_members (community_slug) values ('dicoding')`));
    await as(a, async () => {
      eq(await affected('delete from public.community_members where user_id = $1', [b]), 0, 'delete');
      await rejects(q(`insert into public.community_members (user_id, community_slug) values ($1, 'aiesec')`, [b]), DENIED, 'insert atas nama B');
    });
    eq(await val('select count(*)::int from public.community_members where user_id = $1', [b]), 1, 'keanggotaan B');
  });

  await test('isolasi: A tidak bisa menghapus atau membuat koneksi atas nama B', async () => {
    const a = await signup();
    const b = await signup();
    const c = await signup();
    await as(b, () => q('insert into public.connections (following_id) values ($1)', [c]));
    await as(a, async () => {
      eq(await affected('delete from public.connections where follower_id = $1', [b]), 0, 'delete');
      await rejects(q('insert into public.connections (follower_id, following_id) values ($1, $2)', [b, a]), DENIED, 'insert atas nama B');
    });
    eq(await val('select count(*)::int from public.connections where follower_id = $1', [b]), 1, 'koneksi B');
  });

  // ---------------- Schema private dan tabel capaian ----------------
  await test('private: pengguna tidak bisa menulis point_events, user_badges, journey_events', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`insert into public.point_events (user_id, delta, reason) values ($1, 1000, 'curang')`, [id]), DENIED, 'point_events');
      await rejects(q(`insert into public.user_badges (user_id, badge_code) values ($1, 'certified')`, [id]), DENIED, 'user_badges');
      await rejects(q(`insert into public.journey_events (user_id, stage, title) values ($1, 'innovator', 'x')`, [id]), DENIED, 'journey_events');
    });
  });

  // Menghapus riwayat poin sendiri akan membuka hadiah "sekali saja" lagi.
  await test('private: pengguna tidak bisa menghapus atau mengubah riwayat poin, lencana, journey miliknya', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q('delete from public.point_events where user_id = $1', [id]), DENIED, 'delete point_events');
      await rejects(q('update public.point_events set delta = 999 where user_id = $1', [id]), DENIED, 'update point_events');
      await rejects(q('delete from public.user_badges where user_id = $1', [id]), DENIED, 'delete user_badges');
      await rejects(q('delete from public.journey_events where user_id = $1', [id]), DENIED, 'delete journey_events');
    });
  });

  await test('private: authenticated dan anon tidak bisa memanggil private.award', async () => {
    const id = await signup();
    await as(id, () => rejects(q(`select private.award($1, 'curang', 1000)`, [id]), DENIED, 'authenticated'));
    await anon(() => rejects(q(`select private.award($1, 'curang', 1000)`, [id]), DENIED, 'anon'));
    eq(await points(id), 50, 'poin');
  });

  await test('private: schema private tidak punya USAGE untuk anon/authenticated', async () => {
    eq(await val(`select has_schema_privilege('authenticated', 'private', 'USAGE')`), false, 'authenticated');
    eq(await val(`select has_schema_privilege('anon', 'private', 'USAGE')`), false, 'anon');
    const id = await signup();
    await as(id, () => rejects(q('select private.touch_updated_at()'), DENIED, 'fungsi private lain'));
  });

  // ---------------- Hadiah ----------------
  await test('hadiah: komunitas ke-1/3/5 memberi first_community, connector, community_explorer tepat sekali', async () => {
    const id = await signup();
    const slugs = ['blockplay', 'isp', 'web3-enthusiast', 'kompaschain', 'crypto-legal'];
    const expected = [70, 70, 100, 100, 120];
    for (let i = 0; i < slugs.length; i++) {
      await as(id, () => q('insert into public.community_members (community_slug) values ($1)', [slugs[i]]));
      eq(await points(id), expected[i], `poin setelah komunitas ke-${i + 1}`);
    }
    const p = await profile(id);
    eq(p.journey_stage, 'connector', 'journey_stage');
    eq(await val('select array_agg(badge_code order by badge_code) from public.user_badges where user_id = $1', [id]),
      ['community_explorer', 'first_community', 'first_step'], 'lencana');
    eq(await val('select array_agg(stage order by stage) from public.journey_events where user_id = $1', [id]), ['connector', 'explorer'], 'journey');
    eq(await val('select count(*)::int from public.point_events where user_id = $1', [id]), 4, 'jumlah point_events');
  });

  await test('hadiah: keluar lalu bergabung ulang tidak memberi apa pun', async () => {
    const id = await signup();
    const slugs = ['blockplay', 'isp', 'web3-enthusiast', 'kompaschain', 'crypto-legal'];
    for (const s of slugs) await as(id, () => q('insert into public.community_members (community_slug) values ($1)', [s]));
    await as(id, () => q('delete from public.community_members where user_id = $1', [id]));
    for (const s of slugs) await as(id, () => q('insert into public.community_members (community_slug) values ($1)', [s]));
    eq(await points(id), 120, 'poin');
    eq(await val('select count(*)::int from public.point_events where user_id = $1', [id]), 4, 'jumlah point_events');
  });

  await test('hadiah: projek pertama memberi first_project + tahap builder sekali saja', async () => {
    const id = await signup();
    await as(id, () => q(`insert into public.projects (title) values ('Satu')`));
    eq(await points(id), 100, 'poin setelah projek pertama');
    let p = await profile(id);
    eq(p.journey_stage, 'builder', 'journey_stage');
    await as(id, async () => {
      await q(`insert into public.projects (title) values ('Dua')`);
      await q('delete from public.projects where user_id = $1', [id]);
      await q(`insert into public.projects (title) values ('Tiga')`);
    });
    eq(await points(id), 100, 'poin tetap');
    eq(await val('select array_agg(badge_code order by badge_code) from public.user_badges where user_id = $1', [id]),
      ['builder', 'first_project', 'first_step'], 'lencana');
    eq(await val(`select count(*)::int from public.journey_events where user_id = $1 and stage = 'builder'`, [id]), 1, 'journey builder');
  });

  await test('hadiah: tahap tidak turun (builder lalu 3 komunitas tetap builder)', async () => {
    const id = await signup();
    await as(id, async () => {
      await q(`insert into public.projects (title) values ('Satu')`);
      for (const s of ['aico', 'bisa-ai', 'dicoding']) await q('insert into public.community_members (community_slug) values ($1)', [s]);
    });
    eq((await profile(id)).journey_stage, 'builder', 'journey_stage');
    eq(await val(`select count(*)::int from public.journey_events where user_id = $1 and stage = 'connector'`, [id]), 1, 'journey connector tercatat');
  });

  await test('hadiah: profil lengkap memberi 30 poin sekali', async () => {
    const id = await signup({ meta: { picture: 'https://lh3.googleusercontent.com/a/p' } });
    const complete = `update public.profiles set headline = $2, about = 'Tentang', skills = array['a','b','c'] where id = $1`;
    await as(id, () => q(complete, [id, 'Satu']));
    eq(await points(id), 80, 'poin');
    await as(id, () => q(complete, [id, 'Dua']));
    eq(await points(id), 80, 'poin tetap');
  });

  await test('hadiah: projek ke-51 ditolak', async () => {
    const id = await signup();
    await as(id, async () => {
      await q(`insert into public.projects (title) select 'Projek ' || g from generate_series(1, 50) g`);
      await rejects(q(`insert into public.projects (title) values ('Ke-51')`), /Batas 50 projek/, 'projek ke-51');
    });
    eq(await val('select count(*)::int from public.projects where user_id = $1', [id]), 50, 'jumlah projek');
  });

  await test('hadiah: sertifikat ke-101 ditolak', async () => {
    const id = await signup();
    await as(id, async () => {
      await q(`insert into public.certificates (title, issuer) select 'S' || g, 'X' from generate_series(1, 100) g`);
      await rejects(q(`insert into public.certificates (title, issuer) values ('Ke-101', 'X')`), /Batas 100 sertifikat/, 'sertifikat ke-101');
    });
  });

  await test('sertifikat: pengguna tidak bisa membuat source=catalyst atau is_verified', async () => {
    const id = await signup();
    await as(id, async () => {
      await rejects(q(`insert into public.certificates (title, issuer, source) values ('S', 'X', 'catalyst')`), DENIED, 'source');
      await rejects(q(`insert into public.certificates (title, issuer, is_verified) values ('S', 'X', true)`), DENIED, 'is_verified');
      const c = await one(`insert into public.certificates (title, issuer) values ('S', 'X') returning source, is_verified`);
      eq(c, { source: 'self', is_verified: false }, 'nilai bawaan');
      await rejects(q(`update public.certificates set is_verified = true where user_id = $1`, [id]), DENIED, 'update is_verified');
      await rejects(q(`update public.certificates set source = 'catalyst' where user_id = $1`, [id]), DENIED, 'update source');
    });
    eq(await points(id), 50, 'sertifikat sendiri tidak memberi poin');
    eq(await val(`select count(*)::int from public.user_badges where user_id = $1 and badge_code = 'certified'`, [id]), 0, 'lencana certified');
  });

  await test('sertifikat: terbitan catalyst tidak bisa diubah atau dihapus pemiliknya', async () => {
    const id = await signup();
    // Diterbitkan admin (SQL Editor), bukan lewat API.
    await db.exec('set role sql_editor');
    const cid = await val(
      `insert into public.certificates (user_id, source, title, issuer, is_verified) values ($1, 'catalyst', 'Resmi', 'Catalyst Academy', true) returning id`,
      [id],
    );
    await db.exec('reset role');
    eq(await points(id), 90, 'lencana certified memberi 40 poin');
    await as(id, async () => {
      eq(await val('select count(*)::int from public.certificates where id = $1', [cid]), 1, 'pemilik melihatnya');
      eq(await affected(`update public.certificates set title = 'Diubah' where id = $1`, [cid]), 0, 'update');
      eq(await affected('delete from public.certificates where id = $1', [cid]), 0, 'delete');
    });
    eq(await val('select title from public.certificates where id = $1', [cid]), 'Resmi', 'judul');
  });

  // ---------------- Keterlihatan ----------------
  const makePrivateUser = async () => {
    const p = await signup();
    const pub = await signup();
    await as(p, async () => {
      await q(`insert into public.projects (title) values ('Rahasia')`);
      await q(`insert into public.certificates (title, issuer) values ('Rahasia', 'X')`);
      await q(`insert into public.community_members (community_slug) values ('python')`);
      await q('insert into public.connections (following_id) values ($1)', [pub]);
      await q('update public.profiles set is_public = false where id = $1', [p]);
    });
    return p;
  };
  const visibleCounts = (p) =>
    one(
      `select
         (select count(*)::int from public.profiles where id = $1) as profiles,
         (select count(*)::int from public.projects where user_id = $1) as projects,
         (select count(*)::int from public.certificates where user_id = $1) as certificates,
         (select count(*)::int from public.community_members where user_id = $1) as memberships,
         (select count(*)::int from public.user_badges where user_id = $1) as badges,
         (select count(*)::int from public.journey_events where user_id = $1) as journey,
         (select count(*)::int from public.connections where follower_id = $1) as connections`,
      [p],
    );
  const hidden = { profiles: 0, projects: 0, certificates: 0, memberships: 0, badges: 0, journey: 0, connections: 0 };

  await test('visibility: profil privat dan semua turunannya tersembunyi dari anon', async () => {
    const p = await makePrivateUser();
    eq(await anon(() => visibleCounts(p)), hidden, 'terlihat anon');
  });

  await test('visibility: profil privat dan semua turunannya tersembunyi dari pengguna lain', async () => {
    const p = await makePrivateUser();
    const other = await signup();
    eq(await as(other, () => visibleCounts(p)), hidden, 'terlihat pengguna lain');
  });

  await test('visibility: pemilik profil privat tetap melihat semua datanya', async () => {
    const p = await makePrivateUser();
    const c = await as(p, () => visibleCounts(p));
    assert(Object.values(c).every((n) => n >= 1), `terlihat pemilik ${JSON.stringify(c)}`);
  });

  await test('visibility: anon membaca profil publik beserta projeknya', async () => {
    const id = await signup();
    await as(id, () => q(`insert into public.projects (title) values ('Publik')`));
    const slug = (await profile(id)).slug;
    await anon(async () => {
      eq(await val('select count(*)::int from public.profiles where slug = $1', [slug]), 1, 'profil');
      eq(await val('select count(*)::int from public.projects where user_id = $1', [id]), 1, 'projek');
    });
  });

  await test('visibility: anon tidak bisa membaca point_events dan profile_views', async () => {
    await anon(async () => {
      await rejects(q('select * from public.point_events'), DENIED, 'point_events');
      await rejects(q('select * from public.profile_views'), DENIED, 'profile_views');
    });
  });

  await test('visibility: pengguna tidak melihat point_events dan profile_views orang lain', async () => {
    const a = await signup();
    const b = await signup();
    await as(a, () => q('select public.record_profile_view(slug) from public.profiles where id = $1', [b]));
    eq(await val('select count(*)::int from public.profile_views where profile_id = $1', [b]), 1, 'kunjungan tercatat');
    await as(a, async () => {
      eq(await val('select count(*)::int from public.point_events where user_id = $1', [b]), 0, 'point_events B');
      eq(await val('select count(*)::int from public.profile_views where profile_id = $1', [b]), 0, 'profile_views B');
    });
  });

  // ---------------- record_profile_view ----------------
  const views = (id) => val('select count(*)::int from public.profile_views where profile_id = $1', [id]);

  await test('record_profile_view: kunjungan anon tercatat', async () => {
    const id = await signup();
    const slug = (await profile(id)).slug;
    await anon(() => q('select public.record_profile_view($1)', [slug]));
    await anon(() => q('select public.record_profile_view($1)', [slug]));
    eq(await views(id), 2, 'kunjungan');
  });

  await test('record_profile_view: kunjungan pemilik diabaikan', async () => {
    const id = await signup();
    const slug = (await profile(id)).slug;
    await as(id, () => q('select public.record_profile_view($1)', [slug]));
    eq(await views(id), 0, 'kunjungan');
  });

  await test('record_profile_view: penonton masuk dihitung sekali per hari', async () => {
    const id = await signup();
    const viewer = await signup();
    const slug = (await profile(id)).slug;
    for (let i = 0; i < 3; i++) await as(viewer, () => q('select public.record_profile_view($1)', [slug]));
    eq(await views(id), 1, 'kunjungan');
    await as(id, async () => {
      eq(await val('select count(*)::int from public.profile_views where profile_id = $1', [id]), 1, 'pemilik membaca jumlah kunjungannya');
      await rejects(q('select viewer_id from public.profile_views where profile_id = $1', [id]), DENIED, 'viewer_id tertutup untuk pemilik');
    });
  });

  await test('record_profile_view: profil privat dan slug tak dikenal diabaikan', async () => {
    const id = await signup();
    const slug = (await profile(id)).slug;
    await as(id, () => q('update public.profiles set is_public = false where id = $1', [id]));
    await anon(() => q('select public.record_profile_view($1)', [slug]));
    await anon(() => q('select public.record_profile_view($1)', ['tidak-ada-slug']));
    eq(await views(id), 0, 'kunjungan');
  });

  // ---------------- Koneksi ----------------
  await test('koneksi: tidak bisa mengikuti diri sendiri', async () => {
    const id = await signup();
    await as(id, () => rejects(q('insert into public.connections (following_id) values ($1)', [id]), /check|row-level/, 'ikuti diri'));
  });

  await test('koneksi: tidak bisa mengikuti profil privat', async () => {
    const a = await signup();
    const p = await signup();
    await as(p, () => q('update public.profiles set is_public = false where id = $1', [p]));
    await as(a, () => rejects(q('insert into public.connections (following_id) values ($1)', [p]), RLS, 'ikuti privat'));
  });

  await test('koneksi: bisa mengikuti profil publik lalu berhenti mengikuti', async () => {
    const a = await signup();
    const b = await signup();
    await as(a, async () => {
      await q('insert into public.connections (following_id) values ($1)', [b]);
      eq(await val('select count(*)::int from public.connections where follower_id = $1 and following_id = $2', [a, b]), 1, 'mengikuti');
      eq(await affected('delete from public.connections where following_id = $1', [b]), 1, 'berhenti');
    });
  });

  // ---------------- Storage ----------------
  const putObject = (uid, bucket, name) =>
    as(uid, () => q('insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)', [bucket, name, uid]));
  const seeObject = (uid, bucket, name) =>
    as(uid, () => val('select count(*)::int from storage.objects where bucket_id = $1 and name = $2', [bucket, name]));

  await test('storage: unggah ke folder uid sendiri di avatars, certificates, cvs', async () => {
    const id = await signup();
    await putObject(id, 'avatars', `${id}/avatar.png`);
    await putObject(id, 'certificates', `${id}/sertifikat.png`);
    await putObject(id, 'cvs', `${id}/cv.pdf`);
  });

  await test('storage: tidak bisa menulis ke folder orang lain, ke akar bucket, atau bucket lain', async () => {
    const a = await signup();
    const b = await signup();
    await rejects(putObject(a, 'avatars', `${b}/avatar.png`), RLS, 'folder B');
    await rejects(putObject(a, 'cvs', `${b}/cv.pdf`), RLS, 'cv B');
    await rejects(putObject(a, 'avatars', 'avatar.png'), RLS, 'akar bucket');
    await db.exec(`insert into storage.buckets (id, name) values ('lain', 'lain') on conflict do nothing`);
    await rejects(putObject(a, 'lain', `${a}/x.png`), RLS, 'bucket lain');
    await anon(() => rejects(q(`insert into storage.objects (bucket_id, name) values ('avatars', 'x/y.png')`), RLS, 'anon'));
  });

  // Membuat bucket cvs publik akan membuka semua CV sekaligus.
  await test('storage: pengguna tidak bisa membuat atau mengubah bucket', async () => {
    const id = await signup();
    await as(id, async () => {
      eq(await affected(`update storage.buckets set public = true where id = 'cvs'`), 0, 'ubah bucket');
      await rejects(q(`insert into storage.buckets (id, name, public) values ('bocor', 'bocor', true)`), RLS, 'buat bucket');
    });
    eq(await val(`select public from storage.buckets where id = 'cvs'`), false, 'cvs tetap privat');
  });

  await test('storage: tidak bisa mengubah, memindah ke, atau menghapus berkas orang lain', async () => {
    const a = await signup();
    const b = await signup();
    await putObject(b, 'cvs', `${b}/cv.pdf`);
    await putObject(a, 'avatars', `${a}/a.png`);
    await as(a, async () => {
      eq(await affected(`update storage.objects set metadata = '{}' where name = $1`, [`${b}/cv.pdf`]), 0, 'ubah berkas B');
      eq(await affected('delete from storage.objects where name = $1', [`${b}/cv.pdf`]), 0, 'hapus berkas B');
      await rejects(q('update storage.objects set name = $1 where name = $2', [`${b}/a.png`, `${a}/a.png`]), RLS, 'pindah ke folder B');
    });
    eq(await val('select count(*)::int from storage.objects where name = $1', [`${b}/cv.pdf`]), 1, 'berkas B utuh');
  });

  // Repo memanggil storage.list() dan remove() untuk avatar dan gambar
  // sertifikat; API storage menjalankan SELECT dan DELETE ... RETURNING
  // sebagai pengguna, jadi pemilik harus lolos kebijakan SELECT.
  await test('storage: pemilik bisa me-list dan menghapus avatar dan gambar sertifikatnya', async () => {
    const id = await signup();
    await putObject(id, 'avatars', `${id}/lama.png`);
    await putObject(id, 'certificates', `${id}/s.png`);
    await as(id, async () => {
      eq(await val(`select count(*)::int from storage.objects where bucket_id in ('avatars','certificates') and name like $1`, [`${id}/%`]), 2, 'list');
      eq((await q(`delete from storage.objects where bucket_id = 'avatars' and name = $1 returning name`, [`${id}/lama.png`])).length, 1, 'hapus avatar');
      eq((await q(`delete from storage.objects where bucket_id = 'certificates' and name = $1 returning name`, [`${id}/s.png`])).length, 1, 'hapus sertifikat');
    });
  });

  await test('storage: pemilik bisa menimpa cv sendiri (upsert butuh SELECT + UPDATE)', async () => {
    const id = await signup();
    await putObject(id, 'cvs', `${id}/cv.pdf`);
    await as(id, async () => {
      eq(await affected(`update storage.objects set metadata = '{"size":1}' where bucket_id = 'cvs' and name = $1`, [`${id}/cv.pdf`]), 1, 'timpa');
    });
  });

  await test('storage: pengguna lain tidak bisa me-list folder avatar orang lain lewat API', async () => {
    const a = await signup();
    const b = await signup();
    await putObject(b, 'avatars', `${b}/avatar.png`);
    eq(await seeObject(a, 'avatars', `${b}/avatar.png`), 0, 'pengguna lain');
    eq(await anon(() => val('select count(*)::int from storage.objects where bucket_id = $1', ['avatars'])), 0, 'anon');
  });

  await test('storage: cv orang lain hanya terbaca kalau profil publik DAN cv_visibility=public', async () => {
    const a = await signup();
    const b = await signup();
    const cv = `${b}/cv.pdf`;
    await putObject(b, 'cvs', cv);
    const anonSees = () => anon(() => val('select count(*)::int from storage.objects where bucket_id = $1 and name = $2', ['cvs', cv]));
    eq([await seeObject(a, 'cvs', cv), await anonSees(), await seeObject(b, 'cvs', cv)], [0, 0, 1], 'cv privat (lain, anon, pemilik)');
    await as(b, () => q(`update public.profiles set cv_visibility = 'public' where id = $1`, [b]));
    eq([await seeObject(a, 'cvs', cv), await anonSees()], [1, 1], 'cv publik, profil publik');
    await as(b, () => q('update public.profiles set is_public = false where id = $1', [b]));
    eq([await seeObject(a, 'cvs', cv), await anonSees(), await seeObject(b, 'cvs', cv)], [0, 0, 1], 'cv publik, profil privat');
  });

  // ---------------- Hapus akun ----------------
  await test('delete_my_account: anon tidak bisa memanggilnya', async () => {
    await anon(() => rejects(q('select public.delete_my_account()'), DENIED, 'anon'));
  });

  await test('delete_my_account: menghapus auth user dan semua data turunannya', async () => {
    const d = await signup();
    const other = await signup();
    await as(d, async () => {
      await q(`insert into public.projects (title) values ('P')`);
      await q(`insert into public.certificates (title, issuer) values ('S', 'X')`);
      await q(`insert into public.community_members (community_slug) values ('yot')`);
      await q('insert into public.connections (following_id) values ($1)', [other]);
    });
    await as(other, async () => {
      await q('insert into public.connections (following_id) values ($1)', [d]);
      await q('select public.record_profile_view(slug) from public.profiles where id = $1', [d]);
    });
    await as(d, () => q('select public.delete_my_account()'));
    const left = await one(
      `select
         (select count(*)::int from auth.users where id = $1) as users,
         (select count(*)::int from public.profiles where id = $1) as profiles,
         (select count(*)::int from public.projects where user_id = $1) as projects,
         (select count(*)::int from public.certificates where user_id = $1) as certificates,
         (select count(*)::int from public.community_members where user_id = $1) as memberships,
         (select count(*)::int from public.connections where follower_id = $1 or following_id = $1) as connections,
         (select count(*)::int from public.point_events where user_id = $1) as points,
         (select count(*)::int from public.user_badges where user_id = $1) as badges,
         (select count(*)::int from public.journey_events where user_id = $1) as journey,
         (select count(*)::int from public.profile_views where profile_id = $1) as views`,
      [d],
    );
    eq(left, { users: 0, profiles: 0, projects: 0, certificates: 0, memberships: 0, connections: 0, points: 0, badges: 0, journey: 0, views: 0 }, 'sisa data');
    assert(await profile(other), 'pengguna lain ikut terhapus');
  });

  await test('delete_my_account: authenticated tanpa sub ditolak', async () => {
    await db.query(`select set_config('request.jwt.claims', '{"role":"authenticated"}', false)`);
    await db.exec('set role authenticated');
    await rejects(q('select public.delete_my_account()'), /Belum masuk/, 'tanpa sub');
  });
}

function report() {
  const w = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(w)}${r.ok ? '' : `  -> ${r.msg}`}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} PASS, ${failed} FAIL`);
  process.exitCode = failed ? 1 : 0;
}

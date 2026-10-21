// Menanam kredensial publik Supabase dari supabase.config.json ke dua tempat:
//
//  - assets/catalyst.js  : dipakai index.html dan login.html
//  - platform/.env.local : dibaca Next saat Passport dibangun
//
// Jalankan setiap kali nilainya berubah, lalu bangun ulang Passport:
//
//   node scripts/set-supabase-env.mjs
//   cd platform && npm ci && npx next build && cd ..
//   python scripts/salin-passport.py
//   npm run build
//
// Kunci anon memang dirancang untuk terlihat publik; keamanan data dijaga
// Row Level Security di Supabase, bukan kerahasiaan kunci ini.
import { readFileSync, writeFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync('supabase.config.json', 'utf8'));

const jsPath = 'assets/catalyst.js';
writeFileSync(jsPath, readFileSync(jsPath, 'utf8')
  .replace(/SUPABASE_URL:\s*'[^']*'/, `SUPABASE_URL: '${cfg.SUPABASE_URL}'`)
  .replace(/SUPABASE_ANON_KEY:\s*'[^']*'/, `SUPABASE_ANON_KEY: '${cfg.SUPABASE_ANON_KEY}'`));

const envPath = 'platform/.env.local';
writeFileSync(envPath,
  `# Dibuat oleh scripts/set-supabase-env.mjs dari supabase.config.json.\n` +
  `NEXT_PUBLIC_SUPABASE_URL=${cfg.SUPABASE_URL}\n` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${cfg.SUPABASE_ANON_KEY}\n` +
  `NEXT_PUBLIC_SITE_URL=${cfg.SITE_URL}\n`);

console.log(`Kredensial Supabase ditanam: ${jsPath} dan ${envPath}.`);

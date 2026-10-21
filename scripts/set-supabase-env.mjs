// Menanam kredensial publik Supabase ke seluruh halaman.
//
// Sumbernya satu: supabase.config.json. Jalankan `node scripts/set-supabase-env.mjs`
// setiap kali nilainya berubah, lalu commit hasilnya.
//
//  - assets/catalyst.js  : dipakai index.html dan login.html
//  - halaman bp/         : ekspor Next.js membaca process.env saat berjalan di
//                          browser, jadi nilainya ditanam sebagai skrip sebaris
//                          paling awal di <head>, sebelum bundel Next dieksekusi.
//
// Kunci anon memang dirancang untuk terlihat publik; keamanan data dijaga oleh
// Row Level Security di Supabase, bukan oleh kerahasiaan kunci ini.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const cfg = JSON.parse(readFileSync('supabase.config.json', 'utf8'));
const PENANDA = 'catalyst-env';

/* ---------- assets/catalyst.js ---------- */
const jsPath = 'assets/catalyst.js';
let js = readFileSync(jsPath, 'utf8');
js = js
  .replace(/SUPABASE_URL:\s*'[^']*'/, `SUPABASE_URL: '${cfg.SUPABASE_URL}'`)
  .replace(/SUPABASE_ANON_KEY:\s*'[^']*'/, `SUPABASE_ANON_KEY: '${cfg.SUPABASE_ANON_KEY}'`);
writeFileSync(jsPath, js);

/* ---------- halaman di dalam bp/ ---------- */
const suntikan = '<script id="' + PENANDA + '">window.process=Object.assign(window.process||{},{env:Object.assign({},(window.process||{}).env,'
  + JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: cfg.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: cfg.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: cfg.SITE_URL
    })
  + ')});</script>';

/* ---------- penjaga sesi di awal halaman ----------
   Ekspor Next.js membawa skrip penjaga yang menebak status masuk dari
   localStorage. Sesi sebenarnya disimpan di cookie oleh @supabase/ssr,
   jadi penjaga itu ditukar dengan pemeriksaan cookie. Tanpa ini, halaman
   Passport melempar pengguna yang sudah masuk kembali ke halaman login. */
const PENJAGA_LAMA = /<script>\(function\(\)\{try\{var m=localStorage\.getItem\('catalyst-demo-sesi'\)[^<]*<\/script>/;
const PENJAGA_BARU = '<script id="catalyst-guard">(function(){try{var masuk=document.cookie.split(";").some(function(c){c=c.trim();return c.indexOf("sb-")===0&&c.indexOf("-auth-token")>0});if(!masuk)location.replace("/login.html?next="+encodeURIComponent(location.pathname))}catch(e){}})();<\/script>';

function daftarHtml(dir) {
  const keluar = [];
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama);
    if (statSync(p).isDirectory()) keluar.push(...daftarHtml(p));
    else if (nama.endsWith('.html')) keluar.push(p);
  }
  return keluar;
}

let jumlah = 0;
for (const berkas of daftarHtml('bp')) {
  let html = readFileSync(berkas, 'utf8');
  html = html.replace(new RegExp('<script id="' + PENANDA + '">.*?</script>'), '');
  html = html.replace(/<script id="catalyst-guard">.*?<\/script>/, '');
  html = html.replace(PENJAGA_LAMA, '');
  if (!/<head>/.test(html)) continue;            // berkas pengalih tanpa <head>
  html = html.replace('<head>', '<head>' + suntikan + PENJAGA_BARU);
  writeFileSync(berkas, html);
  jumlah++;
}

console.log(`Kredensial Supabase ditanam: ${jsPath} dan ${jumlah} halaman di bp/.`);

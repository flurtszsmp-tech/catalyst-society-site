// Menyalin situs ke dist/ dengan JS, CSS, dan HTML yang sudah dipadatkan.
// Dijalankan Vercel lewat vercel.json (buildCommand). Sumber tidak diubah.
import { readdirSync, statSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { transformSync } from 'esbuild';
import { minify } from 'html-minifier-terser';

const OUT = 'dist';
const SKIP = new Set(['dist', 'node_modules', 'platform', 'scripts', '.git', '.vercel', '.netlify', 'supabase-schema.sql',
  'package.json', 'package-lock.json', 'vercel.json', '.vercelignore', '.gitignore', '.github']);

rmSync(OUT, { recursive: true, force: true });
let sebelum = 0, sesudah = 0;

function tulis(dst, isi) { mkdirSync(dirname(dst), { recursive: true }); writeFileSync(dst, isi); sesudah += Buffer.byteLength(isi); }

async function proses(dir) {
  for (const nama of readdirSync(dir)) {
    if (dir === '.' && SKIP.has(nama)) continue;
    const src = join(dir, nama), dst = join(OUT, src);
    if (statSync(src).isDirectory()) { await proses(src); continue; }
    const ext = extname(nama).toLowerCase();
    const mentah = readFileSync(src);
    sebelum += mentah.length;
    if (ext === '.js') {
      tulis(dst, transformSync(mentah.toString('utf8'), { minify: true, target: 'es2019', legalComments: 'none' }).code);
    } else if (ext === '.css') {
      tulis(dst, transformSync(mentah.toString('utf8'), { loader: 'css', minify: true, legalComments: 'none' }).code);
    } else if (ext === '.html') {
      tulis(dst, await minify(mentah.toString('utf8'), {
        collapseWhitespace: true, conservativeCollapse: true, removeComments: true,
        minifyCSS: true, minifyJS: { compress: { passes: 1 }, mangle: true }, keepClosingSlash: true
      }));
    } else {
      mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); sesudah += mentah.length;
    }
  }
}
await proses('.');
console.log('build: ' + (sebelum / 1024).toFixed(0) + ' KB -> ' + (sesudah / 1024).toFixed(0) + ' KB');

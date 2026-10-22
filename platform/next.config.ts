import type { NextConfig } from 'next';

/* Ekspor statis dasbor Passport. Rutenya dipasang langsung di akar catalystsociety.id
   (/passport/, /pass/, /admin/) oleh scripts/salin-passport.py dan scripts/build.mjs. */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

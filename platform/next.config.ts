import type { NextConfig } from 'next';

/* Ekspor statis khusus dasbor Passport, dipasang di catalystsociety.id/bp/ (GitHub Pages). */
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/bp',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const strapiHost = new URL(
  process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com'
).hostname;

const nextConfig = {
  reactStrictMode: true,
  /* Files the server code reads from disk at runtime (lib/links.ts affiliate maps, lib/strapi.ts generated-cover
     manifest). On this server they are simply on disk; on serverless hosts (Netlify) they must be traced into the
     function bundle or the reads find nothing. */
  outputFileTracingIncludes: {
    '/**': ['./data/*.json'],
  },
  allowedDevOrigins: ['bestlookingskin.fxnstudio.com', 'bestlooking.skin', 'www.bestlooking.skin'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: strapiHost },
      { protocol: 'https', hostname: 'bestlooking.skin' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'i1.wp.com' },
      { protocol: 'https', hostname: 'i2.wp.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
    ],
  },
};

export default nextConfig;

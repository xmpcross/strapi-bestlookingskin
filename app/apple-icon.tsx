import { ImageResponse } from 'next/og';

// Apple-touch-icon for iOS home-screen pin / Safari pinned tabs.
// Rendered as a 180x180 PNG via Next.js's ImageResponse.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0F172A',
          borderRadius: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="118"
          height="118"
          viewBox="0 0 64 64"
        >
          <defs>
            <linearGradient id="apple-bls-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
          </defs>
          <g transform="translate(1, 1)">
            <path
              d="M31 8C31 8 13 28 13 39C13 48.9411 21.0589 57 31 57C40.9411 57 49 48.9411 49 39C49 28 31 8 31 8Z"
              fill="url(#apple-bls-gradient)"
            />
            <path
              d="M24 35C24 41 28 46 33 48C30 48 21 44 21 37C21 31 27 23 28 20C26 23 24 30 24 35Z"
              fill="#FFFFFF"
              opacity="0.4"
            />
            <path
              d="M36 26C36 29.8 39.8 33.6 43.6 33.6C39.8 33.6 36 37.4 36 41.2C36 37.4 32.2 33.6 28.4 33.6C32.2 33.6 36 29.8 36 26Z"
              fill="#FFFFFF"
            />
            <circle cx="24" cy="25" r="2.2" fill="#FFFFFF" opacity="0.9" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}


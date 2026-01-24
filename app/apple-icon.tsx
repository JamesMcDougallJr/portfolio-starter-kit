import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '22.5%',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4))' }}
        >
          <defs>
            <linearGradient id="flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <path
            d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
            fill="url(#flame-gradient)"
          />
          <path
            d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
            fill="#fbbf24"
            opacity="0.8"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

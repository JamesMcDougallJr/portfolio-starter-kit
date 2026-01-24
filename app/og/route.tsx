import { ImageResponse } from 'next/og'

export function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'James McDougall'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        {/* Flame watermark in top right */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            display: 'flex',
            opacity: 0.15,
          }}
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 32 32"
          >
            <defs>
              <linearGradient id="og-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <path
              d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
              fill="url(#og-flame-gradient)"
            />
            <path
              d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
              fill="#fbbf24"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Title with gradient text effect */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '900px',
          }}
        >
          <h1
            style={{
              fontSize: title.length > 40 ? '48px' : '64px',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #fb923c 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Footer with flame icon and site name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' }}
          >
            <defs>
              <linearGradient id="og-flame-gradient-2" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <path
              d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
              fill="url(#og-flame-gradient-2)"
            />
            <path
              d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
              fill="#fbbf24"
              opacity="0.8"
            />
          </svg>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#94a3b8',
            }}
          >
            James McDougall
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

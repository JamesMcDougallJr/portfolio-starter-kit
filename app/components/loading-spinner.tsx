interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function FlameSpinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: { width: 16, height: 16 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
  }

  const { width, height } = dimensions[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      className="animate-flame-pulse"
    >
      <defs>
        <linearGradient id="loading-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#loading-flame-gradient)"
      />
      <path
        d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
        fill="#fbbf24"
        opacity="0.8"
        className="animate-flicker"
      />
    </svg>
  )
}

export function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <FlameSpinner size={size} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

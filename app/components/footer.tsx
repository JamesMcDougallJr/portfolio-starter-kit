import { siteConfig } from '../lib/seo'

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SmallFlame() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      className="opacity-70"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="footer-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#footer-flame-gradient)"
      />
      <path
        d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
        fill="#fbbf24"
        opacity="0.8"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mb-16 mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
            <SmallFlame />
            <span>James McDougall</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-600 ml-6">
            {siteConfig.location.city}, {siteConfig.location.region}
          </span>
        </div>
        <ul className="flex flex-col md:flex-row gap-4 text-sm text-slate-600 dark:text-slate-400">
          <li>
            <a
              className="flex items-center transition-all hover:text-primary-color hover:translate-x-1 duration-200"
              rel="noopener noreferrer"
              target="_blank"
              href="/rss"
            >
              <ArrowIcon />
              <p className="ml-2 h-7">rss</p>
            </a>
          </li>
          <li>
            <a
              className="flex items-center transition-all hover:text-primary-color hover:translate-x-1 duration-200"
              rel="noopener noreferrer"
              target="_blank"
              href={siteConfig.social.github}
            >
              <ArrowIcon />
              <p className="ml-2 h-7">github</p>
            </a>
          </li>
          <li>
            <a
              className="flex items-center transition-all hover:text-primary-color hover:translate-x-1 duration-200"
              rel="noopener noreferrer"
              target="_blank"
              href={siteConfig.social.linkedin}
            >
              <ArrowIcon />
              <p className="ml-2 h-7">linkedin</p>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

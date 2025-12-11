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

export default function Footer() {
  return (
    <footer className="mb-16 mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
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
            href="https://github.com/JamesMcDougallJr"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">github</p>
          </a>
        </li>
      </ul>
    </footer>
  )
}

import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          {/* Robot arm icon */}
          <svg
            viewBox="0 0 24 24"
            className="size-5 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 20 C12 16, 10 14, 7 10" />
            <path d="M7 10 C5 7, 4 5, 6 3" />
            <circle cx="6" cy="3" r="1.5" fill="currentColor" />
            <circle cx="7" cy="10" r="1" fill="currentColor" />
            <rect x="10" y="19" width="4" height="3" rx="0.5" />
          </svg>
          <span className="font-display text-sm font-bold text-foreground">
            Continu<span className="text-primary">Learn</span>
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
          <Link href="/simulator" className="transition-colors hover:text-primary">
            Simulator
          </Link>
          <span className="text-border">|</span>
          <span>HackXperience 2026</span>
        </div>
      </div>
    </footer>
  )
}

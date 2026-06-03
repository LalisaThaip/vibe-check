export default function Header() {
  return (
    <header className="pt-10 pb-4 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <svg width="40" height="40" viewBox="0 0 40 40" className="glow-pulse">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" />
          <path d="M12 22 C12 16, 16 12, 20 12 C24 12, 28 16, 28 22" fill="none" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="15" cy="18" r="1.5" fill="#a855f7" />
          <circle cx="25" cy="18" r="1.5" fill="#ec4899" />
          <path d="M14 25 Q20 30 26 25" fill="none" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Vibe Check
        </h1>
      </div>
      <p className="text-gray-500 text-sm tracking-wide">
        AI-powered emotional engagement analysis for short-form video
      </p>
    </header>
  )
}

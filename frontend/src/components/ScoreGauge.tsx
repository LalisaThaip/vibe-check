import { useEffect, useState } from 'react'

interface Props {
  label: string
  score: number
  subtitle: string
  gradient: [string, string]
}

export default function ScoreGauge({ label, score, subtitle, gradient }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1200
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(score * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Average'
    if (s >= 20) return 'Needs Work'
    return 'Low'
  }

  return (
    <div className="bg-vibe-card border border-vibe-border rounded-2xl p-6 flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e1e2e" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={`url(#gauge-${label})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
          className="transition-all duration-100"
        />
        <text x="80" y="72" textAnchor="middle" className="fill-white text-3xl font-bold" fontSize="36" fontWeight="800">
          {animatedScore}
        </text>
        <text x="80" y="96" textAnchor="middle" className="fill-gray-400" fontSize="12">
          {getScoreLabel(animatedScore)}
        </text>
      </svg>
      <div className="text-center">
        <h3 className="text-lg font-bold" style={{ color: gradient[0] }}>{label}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

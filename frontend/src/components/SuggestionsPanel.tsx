import { Suggestion } from '../types'

interface Props {
  suggestions: Suggestion[]
}

const priorityStyles = {
  high: { border: 'border-red-500/30', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-400' },
  medium: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400' },
  low: { border: 'border-green-500/30', bg: 'bg-green-500/5', badge: 'bg-green-500/20 text-green-400' },
}

const categoryIcons: Record<string, string> = {
  hook: 'M13 10V3L4 14h7v7l9-11h-7z',
  expression: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  audio: 'M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12h.01',
  pacing: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  presence: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  general: 'M5 13l4 4L19 7',
}

export default function SuggestionsPanel({ suggestions }: Props) {
  if (!suggestions.length) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-200">Suggestions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s, i) => {
          const style = priorityStyles[s.priority]
          return (
            <div key={i} className={`${style.bg} ${style.border} border rounded-2xl p-4 space-y-2`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d={categoryIcons[s.category] || categoryIcons.general} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-200">{s.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                      {s.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

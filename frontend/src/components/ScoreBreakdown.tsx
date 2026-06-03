import { ScoreBreakdown as ScoreBreakdownType } from '../types'

interface Props {
  breakdown: ScoreBreakdownType
}

const hookItems = [
  { key: 'hook_face_presence', label: 'Face in First 3s', max: 25, color: '#a855f7' },
  { key: 'hook_emotion_intensity', label: 'Opening Expression', max: 25, color: '#ec4899' },
  { key: 'hook_audio_energy', label: 'Audio Energy', max: 25, color: '#06b6d4' },
  { key: 'hook_no_silence', label: 'No Dead Air', max: 25, color: '#22c55e' },
]

const vibeItems = [
  { key: 'vibe_expressiveness', label: 'Expressiveness', max: 30, color: '#a855f7' },
  { key: 'vibe_hook', label: 'Hook Impact', max: 20, color: '#ec4899' },
  { key: 'vibe_audio_engagement', label: 'Audio Engagement', max: 20, color: '#06b6d4' },
  { key: 'vibe_face_presence', label: 'Face Visibility', max: 15, color: '#22c55e' },
  { key: 'vibe_energy_arc', label: 'Energy Arc', max: 15, color: '#eab308' },
]

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-vibe-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-vibe-card border border-vibe-border rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Hook Breakdown</h4>
        {hookItems.map(item => (
          <Bar key={item.key} label={item.label} value={(breakdown as any)[item.key]} max={item.max} color={item.color} />
        ))}
      </div>
      <div className="bg-vibe-card border border-vibe-border rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Vibe Breakdown</h4>
        {vibeItems.map(item => (
          <Bar key={item.key} label={item.label} value={(breakdown as any)[item.key]} max={item.max} color={item.color} />
        ))}
      </div>
    </div>
  )
}

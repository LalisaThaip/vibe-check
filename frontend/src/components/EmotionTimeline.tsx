import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { EmotionFrame } from '../types'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#22c55e',
  surprise: '#eab308',
  sad: '#3b82f6',
  angry: '#ef4444',
  neutral: '#6b7280',
  fear: '#8b5cf6',
  disgust: '#f97316',
}

interface Props {
  data: EmotionFrame[]
}

export default function EmotionTimeline({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    time: `${d.time}s`,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <defs>
          {Object.entries(EMOTION_COLORS).map(([key, color]) => (
            <linearGradient key={key} id={`em-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} domain={[0, 1]} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', fontSize: '12px' }}
          labelStyle={{ color: '#a0a0b0' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        {Object.entries(EMOTION_COLORS).filter(([k]) => k !== 'neutral').map(([key, color]) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={color}
            fill={`url(#em-${key})`}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

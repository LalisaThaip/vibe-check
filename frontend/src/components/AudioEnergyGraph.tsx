import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { AudioAnalysis } from '../types'

interface Props {
  data: AudioAnalysis
}

export default function AudioEnergyGraph({ data }: Props) {
  const formatted = data.timeline.map(d => ({
    ...d,
    time: `${d.time}s`,
    timeNum: d.time,
  }))

  const hookEndIdx = formatted.findIndex(d => d.timeNum > 3)

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', fontSize: '12px' }}
            labelStyle={{ color: '#a0a0b0' }}
            formatter={(value: number) => [value.toFixed(4), 'Energy']}
          />
          {hookEndIdx > 0 && (
            <ReferenceArea
              x1={formatted[0]?.time}
              x2={formatted[Math.min(hookEndIdx, formatted.length - 1)]?.time}
              fill="#a855f7"
              fillOpacity={0.08}
              label={{ value: 'Hook Zone', position: 'insideTop', fill: '#a855f7', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#06b6d4"
            fill="url(#energyGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-3 text-xs text-gray-500 justify-center">
        <span>Avg Energy: <strong className="text-cyan-400">{data.avg_energy.toFixed(4)}</strong></span>
        <span>Peak: <strong className="text-cyan-400">{data.peak_energy.toFixed(4)}</strong></span>
        <span>Silence: <strong className="text-cyan-400">{(data.silence_ratio * 100).toFixed(0)}%</strong></span>
        <span>Onsets/s: <strong className="text-cyan-400">{data.onset_rate.toFixed(1)}</strong></span>
      </div>
    </div>
  )
}

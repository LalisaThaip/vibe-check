import { AnalysisResult } from '../types'
import ScoreGauge from './ScoreGauge'
import EmotionTimeline from './EmotionTimeline'
import AudioEnergyGraph from './AudioEnergyGraph'
import SuggestionsPanel from './SuggestionsPanel'
import ScoreBreakdown from './ScoreBreakdown'

interface Props {
  result: AnalysisResult
  onReset: () => void
}

export default function ResultsDashboard({ result, onReset }: Props) {
  return (
    <div className="mt-8 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Your Results</h2>
        <button
          onClick={onReset}
          className="px-5 py-2 rounded-xl border border-vibe-border hover:border-purple-500/50 text-sm font-medium text-gray-400 hover:text-white transition-all"
        >
          Analyze Another
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreGauge
          label="Vibe Score"
          score={result.vibe_score}
          subtitle="Overall emotional engagement"
          gradient={['#a855f7', '#ec4899']}
        />
        <ScoreGauge
          label="Hook Score"
          score={result.hook_score}
          subtitle="First 3 seconds impact"
          gradient={['#06b6d4', '#22c55e']}
        />
      </div>

      <ScoreBreakdown breakdown={result.score_breakdown} />

      {result.emotion_timeline.length > 0 && (
        <div className="bg-vibe-card border border-vibe-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Emotion Timeline</h3>
          <EmotionTimeline data={result.emotion_timeline} />
        </div>
      )}

      {result.audio.timeline.length > 0 && (
        <div className="bg-vibe-card border border-vibe-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Audio Energy</h3>
          <AudioEnergyGraph data={result.audio} />
        </div>
      )}

      <SuggestionsPanel suggestions={result.suggestions} />

      <div className="text-center text-gray-600 text-xs pb-4">
        Video duration: {result.duration}s | Frames analyzed: {result.emotion_timeline.length}
      </div>
    </div>
  )
}

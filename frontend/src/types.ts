export interface EmotionFrame {
  time: number;
  face_detected: boolean;
  happy: number;
  surprise: number;
  sad: number;
  angry: number;
  neutral: number;
  fear: number;
  disgust: number;
}

export interface AudioFrame {
  time: number;
  energy: number;
  spectral_centroid: number;
}

export interface AudioAnalysis {
  timeline: AudioFrame[];
  avg_energy: number;
  peak_energy: number;
  silence_ratio: number;
  onset_rate: number;
  spectral_centroid_mean: number;
}

export interface ScoreBreakdown {
  hook_face_presence: number;
  hook_emotion_intensity: number;
  hook_audio_energy: number;
  hook_no_silence: number;
  vibe_expressiveness: number;
  vibe_hook: number;
  vibe_audio_engagement: number;
  vibe_face_presence: number;
  vibe_energy_arc: number;
}

export interface Suggestion {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  duration: number;
  emotion_timeline: EmotionFrame[];
  audio: AudioAnalysis;
  vibe_score: number;
  hook_score: number;
  score_breakdown: ScoreBreakdown;
  suggestions: Suggestion[];
}

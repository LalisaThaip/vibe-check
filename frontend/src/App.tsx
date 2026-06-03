import { useState } from 'react'
import { AnalysisResult } from './types'
import UploadZone from './components/UploadZone'
import ResultsDashboard from './components/ResultsDashboard'
import Header from './components/Header'

type AppState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function App() {
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const handleUpload = async (file: File) => {
    setState('uploading')
    setError('')
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 50))
        }
      })

      const response = await new Promise<AnalysisResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error || 'Analysis failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 3) {
            setProgress(75)
            setState('analyzing')
          }
        }

        xhr.open('POST', '/api/analyze')
        xhr.send(formData)
        setState('uploading')
      })

      setProgress(100)
      setResult(response)
      setState('done')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setError('')
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-vibe-bg">
      <Header />
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {(state === 'idle' || state === 'error') && (
          <div className="mt-8">
            <UploadZone onUpload={handleUpload} />
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {(state === 'uploading' || state === 'analyzing') && (
          <div className="mt-32 flex flex-col items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 glow-pulse" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1e2e" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#grad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {progress}%
              </span>
            </div>
            <p className="text-gray-400 text-lg">
              {state === 'uploading' ? 'Uploading video...' : 'Analyzing vibes...'}
            </p>
            <p className="text-gray-600 text-sm">
              This may take a moment for longer videos
            </p>
          </div>
        )}

        {state === 'done' && result && (
          <ResultsDashboard result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}

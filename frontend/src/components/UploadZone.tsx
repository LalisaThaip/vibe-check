import { useState, useRef, useCallback } from 'react'

interface Props {
  onUpload: (file: File) => void
}

export default function UploadZone({ onUpload }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('video/')) onUpload(file)
  }, [onUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 1280 },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const chunks: Blob[] = []
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], 'recording.webm', { type: 'video/webm' })
        onUpload(file)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      mediaRecorderRef.current = mr
      setRecordedChunks([])
      mr.start(100)
      setIsRecording(true)
    } catch {
      alert('Could not access camera/microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-lg shadow-red-500/20">
          <video ref={videoRef} muted className="w-80 h-auto rounded-2xl transform -scale-x-100" />
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Recording
          </div>
        </div>
        <button
          onClick={stopRecording}
          className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
        >
          Stop & Analyze
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-16
          flex flex-col items-center gap-4 transition-all duration-200
          ${isDragging
            ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
            : 'border-vibe-border hover:border-purple-500/50 hover:bg-white/[0.02]'
          }
        `}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-200">
            Drop your video here
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse — MP4, WebM, MOV up to 50MB
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-vibe-border" />
        <span className="text-gray-600 text-sm">or</span>
        <div className="flex-1 h-px bg-vibe-border" />
      </div>

      <button
        onClick={startRecording}
        className="w-full py-4 rounded-2xl border border-vibe-border hover:border-pink-500/50 bg-vibe-card hover:bg-white/[0.02] transition-all flex items-center justify-center gap-3"
      >
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="font-medium text-gray-300">Record with Webcam</span>
      </button>
    </div>
  )
}

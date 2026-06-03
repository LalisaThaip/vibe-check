import subprocess
import tempfile
import os
import numpy as np
import cv2
import mediapipe as mp
import librosa

from .emotions import blendshapes_to_emotions
from .scoring import compute_scores, generate_suggestions

# Azure AI provider is used when AZURE_FACE_ENDPOINT is configured
EMOTION_PROVIDER = os.getenv("EMOTION_PROVIDER", "mediapipe")  # "mediapipe" or "azure"

SAMPLE_RATE = 22050
MAX_DURATION = 60  # seconds
FRAME_SAMPLE_INTERVAL = 0.5  # analyze every 0.5s


def extract_audio(video_path: str, sr: int = SAMPLE_RATE) -> tuple:
    """Extract audio from video using ffmpeg, return (waveform, sr)."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
             "-ar", str(sr), "-ac", "1", tmp_path],
            capture_output=True, timeout=30
        )
        if os.path.getsize(tmp_path) > 0:
            y, _ = librosa.load(tmp_path, sr=sr)
            return y, sr
        return np.array([]), sr
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def get_video_duration(video_path: str) -> float:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    return min(frame_count / fps, MAX_DURATION)


def analyze_emotions(video_path: str, duration: float) -> list:
    """Analyze facial emotions at regular intervals using MediaPipe."""
    BaseOptions = mp.tasks.BaseOptions
    FaceLandmarker = mp.tasks.vision.FaceLandmarker
    FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode

    model_path = os.path.join(os.path.dirname(__file__), "face_landmarker.task")

    if not os.path.exists(model_path):
        return []

    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.IMAGE,
        output_face_blendshapes=True,
        num_faces=1,
    )

    timeline = []
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30

    with FaceLandmarker.create_from_options(options) as landmarker:
        t = 0.0
        while t < duration:
            frame_num = int(t * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = landmarker.detect(mp_image)

            if result.face_blendshapes and len(result.face_blendshapes) > 0:
                blendshapes = {
                    bs.category_name: bs.score
                    for bs in result.face_blendshapes[0]
                }
                emotions = blendshapes_to_emotions(blendshapes)
                timeline.append({"time": round(t, 2), "face_detected": True, **emotions})
            else:
                timeline.append({
                    "time": round(t, 2), "face_detected": False,
                    "happy": 0, "surprise": 0, "sad": 0, "angry": 0,
                    "neutral": 1, "fear": 0, "disgust": 0
                })
            t += FRAME_SAMPLE_INTERVAL

    cap.release()
    return timeline


def analyze_audio(y: np.ndarray, sr: int, duration: float) -> dict:
    """Analyze audio features."""
    if len(y) == 0:
        return {
            "timeline": [],
            "avg_energy": 0,
            "peak_energy": 0,
            "silence_ratio": 1.0,
            "onset_rate": 0,
            "spectral_centroid_mean": 0,
        }

    # Trim to max duration
    max_samples = int(duration * sr)
    y = y[:max_samples]

    hop_length = 512
    frame_length = 2048

    # RMS energy
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)

    # Spectral centroid
    sc = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]

    # Onset detection
    onsets = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop_length)
    onset_rate = len(onsets) / duration if duration > 0 else 0

    # Silence detection (RMS below threshold)
    silence_threshold = 0.01
    silence_frames = np.sum(rms < silence_threshold)
    silence_ratio = silence_frames / len(rms) if len(rms) > 0 else 1.0

    # Downsample timeline to ~2 points per second
    step = max(1, int(len(rms) / (duration * 2)))
    audio_timeline = []
    for i in range(0, len(rms), step):
        audio_timeline.append({
            "time": round(float(times[i]), 2),
            "energy": round(float(rms[i]), 4),
            "spectral_centroid": round(float(sc[i]) if i < len(sc) else 0, 1),
        })

    return {
        "timeline": audio_timeline,
        "avg_energy": round(float(np.mean(rms)), 4),
        "peak_energy": round(float(np.max(rms)), 4),
        "silence_ratio": round(float(silence_ratio), 3),
        "onset_rate": round(float(onset_rate), 2),
        "spectral_centroid_mean": round(float(np.mean(sc)), 1),
    }


def analyze_video(video_path: str) -> dict:
    duration = get_video_duration(video_path)

    # Extract audio
    y, sr = extract_audio(video_path)

    # Analyze emotions — use Azure AI Face API if configured, else MediaPipe
    if EMOTION_PROVIDER == "azure":
        from .azure_ai import analyze_emotions_azure
        emotion_timeline = analyze_emotions_azure(video_path, duration)
    else:
        emotion_timeline = analyze_emotions(video_path, duration)

    audio_analysis = analyze_audio(y, sr, duration)

    # Compute scores
    scores = compute_scores(emotion_timeline, audio_analysis, duration)
    suggestions = generate_suggestions(scores, emotion_timeline, audio_analysis)

    return {
        "duration": round(duration, 2),
        "emotion_timeline": emotion_timeline,
        "audio": audio_analysis,
        "vibe_score": scores["vibe_score"],
        "hook_score": scores["hook_score"],
        "score_breakdown": scores["breakdown"],
        "suggestions": suggestions,
    }

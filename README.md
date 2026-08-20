# Vibe Check — Video Engagement Scoring

**Vibe Check analyses short-form videos and returns two objective scores — a Vibe
Score and a Hook Score — plus a breakdown and concrete, prioritised suggestions
for making the video more engaging.**

Upload a clip, and within seconds you get a quantified read on how expressive,
energetic, and attention-grabbing it is — grounded in what the camera and
microphone actually captured, not guesswork.

---

## Who it's for

Vibe Check turns "does this video pop?" from a gut feeling into numbers you can
compare, track, and act on:

- **Video producers / editors** — score cuts before publishing; A/B two edits and
  keep the one that opens stronger.
- **Influencers & content creators** — tighten your first 3 seconds (the hook)
  where most viewers decide to swipe away, and see whether your energy carries.
- **Marketing & social teams** — quantify engagement potential across a batch of
  ad or campaign videos, justify creative decisions with a consistent metric, and
  get specific fixes instead of vague "make it punchier" notes.

The goal is **measure → understand → improve**: every score comes with a
breakdown of *why*, and every weak area comes with an actionable tip.

---

## The two scores

### 🎣 Hook Score (0–100) — the first 3 seconds
Short-form platforms live and die on the opening moment. The Hook Score measures
how strongly the video grabs attention in its first seconds, across four equally
weighted signals (25 points each):

| Signal | Points | What it rewards |
|---|---|---|
| **Face presence** (first 3s) | 25 | A face on screen early — proportion of opening frames with a detected face |
| **Emotional intensity** (first 3s) | 25 | A non-neutral opening expression (smile, surprise, animation) rather than a flat face |
| **Audio energy** (first 3s) | 25 | Opening loudness relative to the video's own average energy — a strong start |
| **No dead air** (first 1s) | 25 | Sound from the very start; near-silent openings are penalised |

### ✨ Vibe Score (0–100) — the whole video
A holistic read on overall engagement and energy, combining five weighted
components:

| Component | Points | What it measures |
|---|---|---|
| **Expressiveness** | 30 | Intensity **and** variety of facial emotion across the clip (70% intensity, 30% variety of emotions shown) |
| **Hook contribution** | 20 | The Hook Score folded in (a great opening lifts the whole video) |
| **Audio engagement** | 20 | Average energy (60%) + onset rate / rhythmic activity (40%) |
| **Face presence** | 15 | How consistently a face is in frame across the entire video |
| **Energy arc** | 15 | Dynamics — does the energy build and vary (peaks and valleys) rather than stay flat? |

Both scores are capped at 100 and returned with a per-signal `breakdown` so you can
see exactly where the points came from.

---

## How the scoring works (the ML + the maths)

Vibe Check is deliberately **transparent and explainable**. It uses machine
learning for *perception* — turning pixels and audio into signals — and a
**rule-based weighted formula** for *scoring*, so every number is traceable to an
observable feature. It is not a black-box "engagement predictor" trained on view
counts; it's an interpretable model of the qualities that drive engagement.

### 1. Facial emotion (computer vision)
- **Default engine — Google MediaPipe Face Landmarker.** Frames are sampled every
  **0.5s** (up to a 60s cap). For each frame the model outputs facial
  *blendshapes* (fine-grained muscle activations like `mouthSmile`, `browInnerUp`,
  `jawOpen`, `noseSneer`).
- Blendshapes are mapped to **seven emotion signals** — happy, surprise, sad,
  angry, fear, disgust, and neutral — via interpretable combinations
  (`backend/emotions.py`). Example: smile + cheek-squint blendshapes → *happy*;
  inner-brow-up + wide-eyes → *fear/surprise*. Values are normalised to sum to ~1
  per frame.
- **Optional engine — Azure AI Face API.** Set `EMOTION_PROVIDER=azure` to use
  Azure's hosted emotion attributes instead of the local model
  (`backend/azure_ai.py`). Everything downstream is identical.

Each sampled frame becomes a point on an **emotion timeline**, recording whether a
face was detected and the strength of each emotion.

### 2. Audio analysis (signal processing)
Audio is extracted with **ffmpeg** and analysed with **librosa**
(`backend/analyzer.py`):
- **RMS energy** over time → loudness / intensity and its variation
- **Onset detection** → how rhythmically active / punchy the audio is
- **Spectral centroid** → brightness of the sound
- **Silence detection** → dead air, especially in the critical first second

This yields an **audio timeline** plus summary stats (average energy, peak energy,
onset rate, silence ratio).

### 3. Scoring (rule-based, weighted)
`backend/scoring.py` combines the emotion timeline and audio features into the
Hook and Vibe scores using the point allocations in the tables above. Every rule
is a simple, inspectable calculation (ratios, means, standard deviation of energy
for the "arc", etc.), so results are consistent and reproducible — the same video
always scores the same way, and you can see precisely why.

### 4. Suggestions engine
Finally, the same breakdown drives **prioritised, actionable feedback**
(`generate_suggestions`). When a signal falls below its threshold, Vibe Check
emits a targeted tip tagged by category (`hook`, `expression`, `audio`, `pacing`,
`presence`) and priority (high / medium / low) — e.g. *"Show your face early,"*
*"Start with sound,"* *"Vary your pacing."* Strong videos get positive
reinforcement instead.

> **In short:** ML/CV + DSP extract *what actually happened* on screen and in the
> audio; a transparent weighted rubric turns that into scores; thresholds turn the
> weak spots into a to-do list.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React + TypeScript, Vite, Tailwind CSS, Recharts (timeline/energy charts), Framer Motion |
| **Backend** | Python, FastAPI, Uvicorn |
| **Vision** | MediaPipe Face Landmarker (default) · Azure AI Face API (optional) |
| **Audio** | ffmpeg + librosa |
| **Storage** | Local temp files (default) · Azure Blob Storage (optional) |
| **Packaging** | Multi-stage Docker (Node build → Python runtime) |
| **Cloud (optional)** | Azure Functions + Bicep IaC (`azure-function/`, `infra/`, `azure-pipelines.yml`) |

The backend serves the built frontend as static files and exposes a small API.

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Liveness + which storage backend is active |
| `/api/analyze` | POST | `multipart/form-data` with a `file` (video). Returns scores, breakdown, emotion timeline, audio analysis, and suggestions. Max 50 MB; videos capped at 60s of analysis. |

Example response (abridged):
```json
{
  "duration": 24.5,
  "vibe_score": 78,
  "hook_score": 84,
  "score_breakdown": { "hook_face_presence": 25, "vibe_expressiveness": 24, "...": 0 },
  "emotion_timeline": [ { "time": 0.0, "face_detected": true, "happy": 0.42, "neutral": 0.3, "...": 0 } ],
  "audio": { "avg_energy": 0.06, "onset_rate": 2.1, "silence_ratio": 0.08, "timeline": [] },
  "suggestions": [ { "category": "hook", "title": "Lead with Energy", "priority": "medium", "description": "..." } ]
}
```

---

## Running locally

### With Docker (recommended)
```bash
docker compose up -d --build
# → http://localhost:8011
```

### Manual (dev)
```bash
# Backend
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

### Configuration (optional)
Copy `.env.example` to `.env` to enable the hosted providers. All are optional —
Vibe Check runs fully **offline/local** by default (MediaPipe + local temp files):

| Variable | Purpose |
|---|---|
| `EMOTION_PROVIDER` | `mediapipe` (default) or `azure` |
| `AZURE_FACE_ENDPOINT` / `AZURE_FACE_KEY` | Use Azure AI Face API for emotion detection |
| `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_CONTAINER` | Persist uploads to Azure Blob Storage |

---

## Project layout
```
backend/          FastAPI app, analysis + scoring
  main.py         API (/api/health, /api/analyze) + static frontend serving
  analyzer.py     orchestration: video → emotion timeline + audio features
  emotions.py     MediaPipe blendshapes → 7 emotion signals
  azure_ai.py     optional Azure Face API provider
  scoring.py      rule-based Vibe/Hook scoring + suggestions
frontend/         React + TypeScript UI (upload, gauges, charts, suggestions)
azure-function/   optional serverless deployment
infra/            Bicep infrastructure-as-code
Dockerfile        multi-stage build (frontend → Python runtime)
```

---

## Notes & limitations
- Analysis is capped at **60 seconds** and frames are sampled every **0.5s** for
  speed — designed for short-form (Reels / TikTok / Shorts / ads).
- Scores reflect **on-camera expressiveness, audio energy, and opening strength** —
  strong proxies for engagement, but not a guarantee of views. Treat them as a
  consistent, improvable signal, not an oracle.
- Emotion mapping from blendshapes is heuristic and works best with a clear,
  well-lit, front-facing subject.

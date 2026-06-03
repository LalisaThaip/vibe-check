"""Rule-based scoring for vibe and hook scores."""

import numpy as np


def compute_scores(emotion_timeline: list, audio: dict, duration: float) -> dict:
    """Compute Vibe Score and Hook Score from analysis data."""
    breakdown = {}

    # --- Hook Score (0-100) ---
    hook_window = 3.0  # first 3 seconds

    # 1. Face presence in first 3s (25 pts)
    hook_frames = [f for f in emotion_timeline if f["time"] <= hook_window]
    if hook_frames:
        face_ratio = sum(1 for f in hook_frames if f["face_detected"]) / len(hook_frames)
        hook_face = round(face_ratio * 25)
    else:
        hook_face = 0
    breakdown["hook_face_presence"] = hook_face

    # 2. Emotional intensity in first 3s (25 pts)
    if hook_frames:
        intensities = [1.0 - f.get("neutral", 1.0) for f in hook_frames if f["face_detected"]]
        avg_intensity = np.mean(intensities) if intensities else 0
        hook_emotion = round(min(1.0, avg_intensity * 2) * 25)
    else:
        hook_emotion = 0
    breakdown["hook_emotion_intensity"] = hook_emotion

    # 3. Audio energy vs average in first 3s (25 pts)
    hook_audio = [a for a in audio.get("timeline", []) if a["time"] <= hook_window]
    avg_energy = audio.get("avg_energy", 0)
    if hook_audio and avg_energy > 0:
        hook_energy_avg = np.mean([a["energy"] for a in hook_audio])
        energy_ratio = hook_energy_avg / avg_energy
        hook_audio_score = round(min(1.0, energy_ratio) * 25)
    else:
        hook_audio_score = 5 if avg_energy > 0 else 0
    breakdown["hook_audio_energy"] = hook_audio_score

    # 4. No silence in first 1s (25 pts)
    first_sec_audio = [a for a in audio.get("timeline", []) if a["time"] <= 1.0]
    if first_sec_audio:
        has_silence = any(a["energy"] < 0.01 for a in first_sec_audio)
        hook_silence = 25 if not has_silence else 8
    else:
        hook_silence = 0
    breakdown["hook_no_silence"] = hook_silence

    hook_score = hook_face + hook_emotion + hook_audio_score + hook_silence

    # --- Vibe Score (0-100) ---

    # 1. Expressiveness (30 pts) - variety and intensity of emotions
    if emotion_timeline:
        face_frames = [f for f in emotion_timeline if f["face_detected"]]
        if face_frames:
            emotion_keys = ["happy", "surprise", "sad", "angry", "fear", "disgust"]
            avg_emotions = {k: np.mean([f[k] for f in face_frames]) for k in emotion_keys}
            # Expressiveness = non-neutral intensity + variety
            intensity = 1.0 - np.mean([f["neutral"] for f in face_frames])
            variety = sum(1 for v in avg_emotions.values() if v > 0.05)
            expressiveness = min(1.0, intensity * 0.7 + (variety / 6) * 0.3)
            vibe_express = round(expressiveness * 30)
        else:
            vibe_express = 0
    else:
        vibe_express = 0
    breakdown["vibe_expressiveness"] = vibe_express

    # 2. Hook contribution (20 pts)
    vibe_hook = round(hook_score / 100 * 20)
    breakdown["vibe_hook"] = vibe_hook

    # 3. Audio engagement (20 pts) - energy + onset rate
    if audio.get("avg_energy", 0) > 0:
        energy_norm = min(1.0, audio["avg_energy"] / 0.1)
        onset_norm = min(1.0, audio.get("onset_rate", 0) / 4.0)
        audio_engage = min(1.0, energy_norm * 0.6 + onset_norm * 0.4)
        vibe_audio = round(audio_engage * 20)
    else:
        vibe_audio = 0
    breakdown["vibe_audio_engagement"] = vibe_audio

    # 4. Face presence overall (15 pts)
    if emotion_timeline:
        face_ratio_all = sum(1 for f in emotion_timeline if f["face_detected"]) / len(emotion_timeline)
        vibe_face = round(face_ratio_all * 15)
    else:
        vibe_face = 0
    breakdown["vibe_face_presence"] = vibe_face

    # 5. Energy arc (15 pts) - does energy build/vary interestingly?
    audio_tl = audio.get("timeline", [])
    if len(audio_tl) >= 4:
        energies = [a["energy"] for a in audio_tl]
        energy_std = np.std(energies)
        energy_range = max(energies) - min(energies) if energies else 0
        arc_score = min(1.0, (energy_std / 0.05 + energy_range / 0.1) / 2)
        vibe_arc = round(arc_score * 15)
    else:
        vibe_arc = 5
    breakdown["vibe_energy_arc"] = vibe_arc

    vibe_score = vibe_express + vibe_hook + vibe_audio + vibe_face + vibe_arc

    return {
        "vibe_score": min(100, vibe_score),
        "hook_score": min(100, hook_score),
        "breakdown": breakdown,
    }


def generate_suggestions(scores: dict, emotion_timeline: list, audio: dict) -> list:
    """Generate actionable suggestions based on scores."""
    suggestions = []
    bd = scores["breakdown"]

    if bd.get("hook_face_presence", 0) < 15:
        suggestions.append({
            "category": "hook",
            "title": "Show Your Face Early",
            "description": "Your face isn't prominent in the first 3 seconds. Start with a close-up to grab attention immediately.",
            "priority": "high",
        })

    if bd.get("hook_no_silence", 0) < 15:
        suggestions.append({
            "category": "hook",
            "title": "Start with Sound",
            "description": "The first second has too much silence. Open with speech, music, or a sound effect to hook viewers.",
            "priority": "high",
        })

    if bd.get("hook_emotion_intensity", 0) < 12:
        suggestions.append({
            "category": "hook",
            "title": "Lead with Energy",
            "description": "Your opening expression is too neutral. Start with a smile, surprised look, or animated expression.",
            "priority": "medium",
        })

    if bd.get("vibe_expressiveness", 0) < 15:
        suggestions.append({
            "category": "expression",
            "title": "Be More Expressive",
            "description": "Your facial expressions are quite subtle. Exaggerate your reactions — what feels natural on camera often reads as flat.",
            "priority": "medium",
        })

    if bd.get("vibe_audio_engagement", 0) < 10:
        suggestions.append({
            "category": "audio",
            "title": "Boost Audio Energy",
            "description": "Your audio levels are low. Speak louder, add background music, or use sound effects to increase engagement.",
            "priority": "medium",
        })

    if bd.get("vibe_energy_arc", 0) < 7:
        suggestions.append({
            "category": "pacing",
            "title": "Vary Your Pacing",
            "description": "The energy stays flat throughout. Create peaks and valleys — build tension, then release it.",
            "priority": "low",
        })

    face_frames = [f for f in emotion_timeline if f["face_detected"]]
    if emotion_timeline and len(face_frames) / max(1, len(emotion_timeline)) < 0.5:
        suggestions.append({
            "category": "presence",
            "title": "Stay in Frame",
            "description": "Your face is missing from too many frames. Keep yourself centered and visible throughout the video.",
            "priority": "medium",
        })

    if not suggestions:
        suggestions.append({
            "category": "general",
            "title": "Great Job!",
            "description": "Your video scores well across all metrics. Keep doing what you're doing!",
            "priority": "low",
        })

    return suggestions

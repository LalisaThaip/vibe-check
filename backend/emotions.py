"""Map MediaPipe face blendshapes to emotion categories."""


def blendshapes_to_emotions(bs: dict) -> dict:
    """Convert blendshape scores to emotion probabilities."""
    happy = min(1.0, (
        bs.get("mouthSmileLeft", 0) + bs.get("mouthSmileRight", 0) +
        bs.get("cheekSquintLeft", 0) + bs.get("cheekSquintRight", 0)
    ) / 2.0)

    surprise = min(1.0, (
        bs.get("browInnerUp", 0) +
        bs.get("browOuterUpLeft", 0) + bs.get("browOuterUpRight", 0) +
        bs.get("jawOpen", 0) * 0.5
    ) / 2.0)

    sad = min(1.0, (
        bs.get("mouthFrownLeft", 0) + bs.get("mouthFrownRight", 0) +
        bs.get("browDownLeft", 0) * 0.3 + bs.get("browDownRight", 0) * 0.3
    ) / 1.5)

    angry = min(1.0, (
        bs.get("browDownLeft", 0) + bs.get("browDownRight", 0) +
        bs.get("mouthShrugUpper", 0) * 0.5 +
        bs.get("noseSneerLeft", 0) + bs.get("noseSneerRight", 0)
    ) / 2.5)

    fear = min(1.0, (
        bs.get("browInnerUp", 0) +
        bs.get("eyeWideLeft", 0) + bs.get("eyeWideRight", 0) +
        bs.get("mouthFrownLeft", 0) * 0.3 + bs.get("mouthFrownRight", 0) * 0.3
    ) / 2.5)

    disgust = min(1.0, (
        bs.get("noseSneerLeft", 0) + bs.get("noseSneerRight", 0) +
        bs.get("mouthUpperUpLeft", 0) + bs.get("mouthUpperUpRight", 0)
    ) / 2.0)

    # Neutral is inverse of other emotions
    total_emotion = happy + surprise + sad + angry + fear + disgust
    neutral = max(0.0, 1.0 - total_emotion * 0.7)

    # Normalize to sum to ~1
    total = happy + surprise + sad + angry + fear + disgust + neutral
    if total > 0:
        factor = 1.0 / total
        return {
            "happy": round(happy * factor, 3),
            "surprise": round(surprise * factor, 3),
            "sad": round(sad * factor, 3),
            "angry": round(angry * factor, 3),
            "neutral": round(neutral * factor, 3),
            "fear": round(fear * factor, 3),
            "disgust": round(disgust * factor, 3),
        }

    return {
        "happy": 0, "surprise": 0, "sad": 0,
        "angry": 0, "neutral": 1, "fear": 0, "disgust": 0
    }

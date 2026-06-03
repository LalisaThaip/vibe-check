"""Azure AI Face API integration for emotion detection."""

import os
import cv2
import numpy as np
from azure.ai.vision.face import FaceClient
from azure.ai.vision.face.models import (
    FaceDetectionModel,
    FaceRecognitionModel,
    FaceAttributeTypeDetection,
)
from azure.core.credentials import AzureKeyCredential

AZURE_FACE_ENDPOINT = os.getenv("AZURE_FACE_ENDPOINT", "")
AZURE_FACE_KEY = os.getenv("AZURE_FACE_KEY", "")

FRAME_SAMPLE_INTERVAL = 0.5


def get_face_client() -> FaceClient:
    if not AZURE_FACE_ENDPOINT or not AZURE_FACE_KEY:
        raise RuntimeError("Azure Face API credentials are not configured")
    return FaceClient(
        endpoint=AZURE_FACE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_FACE_KEY),
    )


def analyze_emotions_azure(video_path: str, duration: float) -> list:
    """Analyze facial emotions using Azure AI Face API at regular intervals."""
    client = get_face_client()

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    timeline = []

    t = 0.0
    while t < duration:
        frame_num = int(t * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if not ret:
            break

        # Encode frame as JPEG for the API
        _, buffer = cv2.imencode(".jpg", frame)
        image_bytes = buffer.tobytes()

        faces = client.detect(
            image_content=image_bytes,
            detection_model=FaceDetectionModel.DETECTION_03,
            recognition_model=FaceRecognitionModel.RECOGNITION_04,
            return_face_attributes=[FaceAttributeTypeDetection.HEAD_POSE],
        )

        if faces:
            face = faces[0]
            emotions = face.face_attributes.emotion
            timeline.append({
                "time": round(t, 2),
                "face_detected": True,
                "happy": round(emotions.happiness, 3),
                "surprise": round(emotions.surprise, 3),
                "sad": round(emotions.sadness, 3),
                "angry": round(emotions.anger, 3),
                "neutral": round(emotions.neutral, 3),
                "fear": round(emotions.fear, 3),
                "disgust": round(emotions.disgust, 3),
            })
        else:
            timeline.append({
                "time": round(t, 2),
                "face_detected": False,
                "happy": 0, "surprise": 0, "sad": 0, "angry": 0,
                "neutral": 1, "fear": 0, "disgust": 0,
            })

        t += FRAME_SAMPLE_INTERVAL

    cap.release()
    return timeline

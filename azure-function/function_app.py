"""Azure Function App entry point for video engagement analysis.

Deployed as an HTTP-triggered Azure Function that accepts video uploads,
stores them in Blob Storage, runs the analysis pipeline, and returns scores.
"""

import azure.functions as func
import json
import os
import tempfile
import logging
import sys

# Add parent dir so we can import the backend package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.analyzer import analyze_video
from backend.azure_storage import upload_video, delete_video

app = func.FunctionApp()

MAX_SIZE_MB = 50


@app.route(route="analyze", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def analyze(req: func.HttpRequest) -> func.HttpResponse:
    """HTTP trigger: analyze uploaded video and return engagement scores."""
    logging.info("Received video analysis request")

    # Get uploaded file
    file = req.files.get("file")
    if not file:
        return func.HttpResponse(
            json.dumps({"error": "No file uploaded"}),
            status_code=400,
            mimetype="application/json",
        )

    content_type = file.content_type or ""
    if not content_type.startswith("video/"):
        return func.HttpResponse(
            json.dumps({"error": "Please upload a video file"}),
            status_code=400,
            mimetype="application/json",
        )

    file_bytes = file.read()
    if len(file_bytes) > MAX_SIZE_MB * 1024 * 1024:
        return func.HttpResponse(
            json.dumps({"error": f"File too large (max {MAX_SIZE_MB}MB)"}),
            status_code=400,
            mimetype="application/json",
        )

    blob_meta = None
    try:
        # Upload to Blob Storage for persistence
        blob_meta = upload_video(file_bytes, file.filename or "video.mp4")
        logging.info(f"Video stored at: {blob_meta['blob_name']}")

        # Write to temp file for local analysis
        suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        result = analyze_video(tmp_path)
        result["blob_name"] = blob_meta["blob_name"]

        return func.HttpResponse(
            json.dumps(result),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        logging.exception("Analysis failed")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json",
        )

    finally:
        if "tmp_path" in locals():
            os.unlink(tmp_path)


@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"status": "ok"}),
        mimetype="application/json",
    )

import os
import tempfile
import traceback
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from .analyzer import analyze_video

app = FastAPI()

UPLOAD_MAX_MB = 50
USE_AZURE_STORAGE = bool(os.getenv("AZURE_STORAGE_CONNECTION_STRING"))


@app.get("/api/health")
def health():
    return {"status": "ok", "storage": "azure" if USE_AZURE_STORAGE else "local"}

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("video/"):
        return JSONResponse({"error": "Please upload a video file"}, status_code=400)

    contents = await file.read()
    if len(contents) > UPLOAD_MAX_MB * 1024 * 1024:
        return JSONResponse({"error": f"File too large (max {UPLOAD_MAX_MB}MB)"}, status_code=400)

    # Store in Azure Blob Storage if configured
    blob_meta = None
    if USE_AZURE_STORAGE:
        from .azure_storage import upload_video
        blob_meta = upload_video(contents, file.filename or "video.mp4")

    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = analyze_video(tmp_path)
        if blob_meta:
            result["blob_name"] = blob_meta["blob_name"]
            result["blob_url"] = blob_meta["url"]
        return result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        os.unlink(tmp_path)

# Serve frontend - must be last
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

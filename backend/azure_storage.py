"""Azure Blob Storage integration for video upload and retrieval."""

import os
import uuid
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta, timezone

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "vibe-check-videos")


def get_blob_service_client() -> BlobServiceClient:
    if not AZURE_STORAGE_CONNECTION_STRING:
        raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is not configured")
    return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)


def ensure_container_exists(client: BlobServiceClient):
    container_client = client.get_container_client(AZURE_STORAGE_CONTAINER)
    if not container_client.exists():
        container_client.create_container()


def upload_video(file_bytes: bytes, filename: str) -> dict:
    """Upload video to Azure Blob Storage and return blob metadata."""
    client = get_blob_service_client()
    ensure_container_exists(client)

    blob_name = f"{uuid.uuid4().hex}/{filename}"
    blob_client = client.get_blob_client(AZURE_STORAGE_CONTAINER, blob_name)

    blob_client.upload_blob(
        file_bytes,
        content_settings={"content_type": "video/mp4"},
        overwrite=True,
    )

    return {
        "blob_name": blob_name,
        "container": AZURE_STORAGE_CONTAINER,
        "url": blob_client.url,
    }


def download_video(blob_name: str) -> bytes:
    """Download video bytes from Azure Blob Storage."""
    client = get_blob_service_client()
    blob_client = client.get_blob_client(AZURE_STORAGE_CONTAINER, blob_name)
    return blob_client.download_blob().readall()


def generate_sas_url(blob_name: str, expiry_hours: int = 1) -> str:
    """Generate a time-limited SAS URL for blob access."""
    client = get_blob_service_client()
    account_name = client.account_name
    account_key = client.credential.account_key

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=AZURE_STORAGE_CONTAINER,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
    )

    blob_client = client.get_blob_client(AZURE_STORAGE_CONTAINER, blob_name)
    return f"{blob_client.url}?{sas_token}"


def delete_video(blob_name: str):
    """Delete a video blob from storage."""
    client = get_blob_service_client()
    blob_client = client.get_blob_client(AZURE_STORAGE_CONTAINER, blob_name)
    blob_client.delete_blob()

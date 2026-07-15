"""
Dataset upload / analyze / clean / export endpoints.

Storage flow:
  1. File is uploaded by the user -> saved temporarily -> pushed to
     Supabase Storage bucket (see app/supabase_client.py) at
     "raw/{dataset_id}/{filename}".
  2. Metadata (owner, filename, row/col counts, quality score) is written
     to the "datasets" table in Supabase Postgres.
  3. Cleaning operations produce a new file at
     "cleaned/{dataset_id}/{filename}" -- the raw file is never overwritten.
"""

import os
import uuid
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel

from app.services.profiler import load_dataframe, profile_dataset
from app.services.doctor import diagnose
from app.services.cleaner import apply_operations
from app.supabase_client import get_supabase, upload_dataset, download_dataset
from app.auth import get_current_user

router = APIRouter(prefix="/datasets", tags=["datasets"])


class CleanRequest(BaseModel):
    dataset_id: str
    operation_ids: list[str]


@router.get("")
async def list_datasets(user: dict = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("datasets")
        .select("*")
        .eq("owner_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    dataset_id = str(uuid.uuid4())
    suffix = os.path.splitext(file.filename)[1]

    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    storage_path = f"raw/{dataset_id}/{file.filename}"
    upload_dataset(tmp_path, storage_path)

    df = load_dataframe(tmp_path)
    profile = profile_dataset(df)

    get_supabase().table("datasets").insert(
        {
            "id": dataset_id,
            "owner_id": user["id"],
            "filename": file.filename,
            "storage_path": storage_path,
            "row_count": profile["row_count"],
            "column_count": profile["column_count"],
            "quality_score": profile["quality_score"],
        }
    ).execute()

    os.remove(tmp_path)
    return {"dataset_id": dataset_id, "profile": profile}


@router.get("/{dataset_id}/diagnose")
async def get_diagnosis(dataset_id: str, user: dict = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("datasets")
        .select("*")
        .eq("id", dataset_id)
        .eq("owner_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Dataset not found")

    tmp_path = f"/tmp/{dataset_id}_{result.data['filename']}"
    download_dataset(result.data["storage_path"], tmp_path)
    df = load_dataframe(tmp_path)
    profile = profile_dataset(df)
    os.remove(tmp_path)

    return diagnose(profile)


@router.post("/clean")
async def clean(req: CleanRequest, user: dict = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("datasets")
        .select("*")
        .eq("id", req.dataset_id)
        .eq("owner_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Dataset not found")

    tmp_path = f"/tmp/{req.dataset_id}_{result.data['filename']}"
    download_dataset(result.data["storage_path"], tmp_path)
    df = load_dataframe(tmp_path)

    cleaned = apply_operations(df, req.operation_ids)

    out_path = f"/tmp/cleaned_{req.dataset_id}_{result.data['filename']}"
    if out_path.endswith(".csv"):
        cleaned.to_csv(out_path, index=False)
    elif out_path.endswith(".xlsx"):
        cleaned.to_excel(out_path, index=False)
    else:
        cleaned.to_json(out_path, orient="records")

    cleaned_storage_path = f"cleaned/{req.dataset_id}/{result.data['filename']}"
    upload_dataset(out_path, cleaned_storage_path)

    os.remove(tmp_path)
    os.remove(out_path)

    return {
        "dataset_id": req.dataset_id,
        "cleaned_storage_path": cleaned_storage_path,
        "preview": cleaned.head(20).to_dict(orient="records"),
    }

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
from app.services.doctor import diagnose, DiagnosisUnavailable
from app.services.cleaner import apply_operations, preview_operations, jsonable_value
from app.supabase_client import get_supabase, upload_dataset, download_dataset, get_signed_url
from app.auth import get_current_user

router = APIRouter(prefix="/datasets", tags=["datasets"])

# Beta limits -- generous enough for real testing, small enough that a
# stray huge file can't take down Render's free-tier memory. Override via
# env vars in Render if these need to change without a code deploy.
MAX_UPLOAD_MB = float(os.environ.get("MAX_UPLOAD_MB", "20"))
MAX_ROWS = int(os.environ.get("MAX_ROWS", "100000"))


class CleanRequest(BaseModel):
    dataset_id: str
    operation_ids: list[str]
    # Maps operation_id -> list of column names it should target, e.g.
    # {"validate_email_addresses": ["email"]}. Built by the frontend from
    # diagnosis.problems, since that's where the profiler's exact column
    # names live. Operations that don't need a column (dedupe, trim) just
    # won't have an entry here.
    columns: dict[str, list[str]] = {}


class PreviewRequest(BaseModel):
    dataset_id: str
    operation_ids: list[str]
    columns: dict[str, list[str]] = {}


class RenameRequest(BaseModel):
    display_name: str


def _build_options(columns: dict[str, list[str]]) -> dict:
    return {op_id: {"columns": cols} for op_id, cols in columns.items() if cols}


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

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(
            413,
            f"File is {size_mb:.1f}MB, which is over the {MAX_UPLOAD_MB:.0f}MB beta limit. "
            "Try a smaller file, or a sample of the full dataset.",
        )

    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        df = load_dataframe(tmp_path)
    except Exception:
        os.remove(tmp_path)
        raise HTTPException(
            400, "Couldn't read that file. Make sure it's a valid CSV, XLSX, or JSON file."
        )

    if len(df) > MAX_ROWS:
        os.remove(tmp_path)
        raise HTTPException(
            413,
            f"Dataset has {len(df):,} rows, which is over the {MAX_ROWS:,}-row beta limit. "
            "Try a sample of the full dataset for now.",
        )

    storage_path = f"raw/{dataset_id}/{file.filename}"
    upload_dataset(tmp_path, storage_path)

    profile = profile_dataset(df)

    get_supabase().table("datasets").insert(
        {
            "id": dataset_id,
            "owner_id": user["id"],
            "filename": file.filename,
            "display_name": file.filename,
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

    try:
        return diagnose(profile)
    except DiagnosisUnavailable as e:
        raise HTTPException(503, str(e))


@router.patch("/{dataset_id}")
async def rename_dataset(
    dataset_id: str, req: RenameRequest, user: dict = Depends(get_current_user)
):
    result = (
        get_supabase()
        .table("datasets")
        .update({"display_name": req.display_name})
        .eq("id", dataset_id)
        .eq("owner_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Dataset not found")
    return result.data[0]


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, user: dict = Depends(get_current_user)):
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

    sb = get_supabase()
    # Best-effort cleanup of both possible storage objects -- the cleaned
    # file may not exist if the user never ran /clean, which is fine.
    try:
        sb.storage.from_(os.environ.get("SUPABASE_STORAGE_BUCKET", "datasets")).remove(
            [result.data["storage_path"], f"cleaned/{dataset_id}/{result.data['filename']}"]
        )
    except Exception:
        pass

    sb.table("datasets").delete().eq("id", dataset_id).eq("owner_id", user["id"]).execute()
    return {"deleted": True}


@router.get("/{dataset_id}/download")
async def get_download_url(
    dataset_id: str, kind: str = "cleaned", user: dict = Depends(get_current_user)
):
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

    if kind == "cleaned":
        storage_path = f"cleaned/{dataset_id}/{result.data['filename']}"
    else:
        storage_path = result.data["storage_path"]

    try:
        url = get_signed_url(storage_path)
    except Exception:
        raise HTTPException(404, "No cleaned file yet -- run /datasets/clean first")

    return {"url": url}


@router.post("/preview")
async def preview_clean(req: PreviewRequest, user: dict = Depends(get_current_user)):
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
    os.remove(tmp_path)

    options = _build_options(req.columns)
    changes = preview_operations(df, req.operation_ids, options=options)
    return {"changes": changes}


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

    before_profile = profile_dataset(df)
    options = _build_options(req.columns)
    cleaned = apply_operations(df, req.operation_ids, options=options)
    after_profile = profile_dataset(cleaned)

    out_path = f"/tmp/cleaned_{req.dataset_id}_{result.data['filename']}"
    if out_path.endswith(".csv"):
        cleaned.to_csv(out_path, index=False)
    elif out_path.endswith(".xlsx"):
        cleaned.to_excel(out_path, index=False)
    else:
        cleaned.to_json(out_path, orient="records")

    cleaned_storage_path = f"cleaned/{req.dataset_id}/{result.data['filename']}"
    upload_dataset(out_path, cleaned_storage_path)

    get_supabase().table("datasets").update(
        {"quality_score": after_profile["quality_score"]}
    ).eq("id", req.dataset_id).execute()

    os.remove(tmp_path)
    os.remove(out_path)

    preview_records = [
        {k: jsonable_value(v) for k, v in row.items()}
        for row in cleaned.head(20).to_dict(orient="records")
    ]

    return {
        "dataset_id": req.dataset_id,
        "cleaned_storage_path": cleaned_storage_path,
        "preview": preview_records,
        "report": {
            "rows_before": before_profile["row_count"],
            "rows_after": after_profile["row_count"],
            "quality_score_before": before_profile["quality_score"],
            "quality_score_after": after_profile["quality_score"],
            "issues_before": len(before_profile["issues"]),
            "issues_after": len(after_profile["issues"]),
            "dimensions_before": before_profile["dimensions"],
            "dimensions_after": after_profile["dimensions"],
        },
    }

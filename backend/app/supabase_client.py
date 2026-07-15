"""
Central Supabase client for Doctor Linda's backend.

Env vars required (set these in Render's dashboard, NOT committed to git):
  SUPABASE_URL              -> Project Settings > API > Project URL
  SUPABASE_SERVICE_ROLE_KEY -> Project Settings > API > service_role key
                                (server-side only, bypasses RLS -- never
                                 expose this to the frontend)
  SUPABASE_STORAGE_BUCKET   -> name of the bucket used for raw/cleaned datasets
                                (e.g. "datasets")
"""

import os
from functools import lru_cache

from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "datasets")


@lru_cache
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. "
            "Add them under Render > Service > Environment."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def upload_dataset(local_path: str, dest_path: str) -> str:
    """Uploads a file to the SUPABASE_STORAGE_BUCKET bucket and returns its storage path."""
    sb = get_supabase()
    with open(local_path, "rb") as f:
        sb.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
            dest_path, f, {"upsert": "true"}
        )
    return dest_path


def download_dataset(storage_path: str, local_path: str) -> str:
    sb = get_supabase()
    data = sb.storage.from_(SUPABASE_STORAGE_BUCKET).download(storage_path)
    with open(local_path, "wb") as f:
        f.write(data)
    return local_path

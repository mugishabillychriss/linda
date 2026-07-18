// Thin client for the Doctor Linda FastAPI backend hosted on Render.
// Set NEXT_PUBLIC_API_URL in Vercel to your Render service URL, e.g.
// "https://linda-u2pw.onrender.com"
import { createClient } from "./supabase/client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ""}` };
}

// Extracts the backend's own error message (FastAPI returns {"detail": "..."}
// on HTTPException) so the user sees "we hit a rate limit, try again in a
// minute" instead of a bare "Diagnosis failed: 503".
async function handleResponse(res: Response) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Response wasn't JSON -- fall back to the generic message above.
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/datasets/upload`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  return handleResponse(res);
}

export async function getDiagnosis(datasetId: string) {
  const res = await fetch(`${API_URL}/datasets/${datasetId}/diagnose`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

export async function previewClean(
  datasetId: string,
  operationIds: string[],
  columns: Record<string, string[]> = {}
) {
  const res = await fetch(`${API_URL}/datasets/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ dataset_id: datasetId, operation_ids: operationIds, columns }),
  });
  return handleResponse(res);
}

export async function cleanDataset(
  datasetId: string,
  operationIds: string[],
  columns: Record<string, string[]> = {}
) {
  const res = await fetch(`${API_URL}/datasets/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ dataset_id: datasetId, operation_ids: operationIds, columns }),
  });
  return handleResponse(res);
}

export async function listDatasets() {
  const res = await fetch(`${API_URL}/datasets`, { headers: await authHeaders() });
  return handleResponse(res);
}

export async function deleteDataset(datasetId: string) {
  const res = await fetch(`${API_URL}/datasets/${datasetId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

export async function renameDataset(datasetId: string, displayName: string) {
  const res = await fetch(`${API_URL}/datasets/${datasetId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ display_name: displayName }),
  });
  return handleResponse(res);
}

export async function getDownloadUrl(datasetId: string, kind: "raw" | "cleaned" = "cleaned") {
  const res = await fetch(`${API_URL}/datasets/${datasetId}/download?kind=${kind}`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

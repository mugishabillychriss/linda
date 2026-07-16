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

export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/datasets/upload`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getDiagnosis(datasetId: string) {
  const res = await fetch(`${API_URL}/datasets/${datasetId}/diagnose`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Diagnosis failed: ${res.status}`);
  return res.json();
}

export async function cleanDataset(datasetId: string, operationIds: string[]) {
  const res = await fetch(`${API_URL}/datasets/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ dataset_id: datasetId, operation_ids: operationIds }),
  });
  if (!res.ok) throw new Error(`Clean failed: ${res.status}`);
  return res.json();
}

export async function listDatasets() {
  const res = await fetch(`${API_URL}/datasets`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function getDownloadUrl(datasetId: string, kind: "raw" | "cleaned" = "cleaned") {
  const res = await fetch(`${API_URL}/datasets/${datasetId}/download?kind=${kind}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Download link failed: ${res.status}`);
  return res.json();
}

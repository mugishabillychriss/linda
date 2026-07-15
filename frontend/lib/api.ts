// Thin client for the Doctor Linda FastAPI backend hosted on Render.
// Set NEXT_PUBLIC_API_URL in Vercel to your Render service URL, e.g.
// "https://doctor-linda-api.onrender.com"
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/datasets/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getDiagnosis(datasetId: string) {
  const res = await fetch(`${API_URL}/datasets/${datasetId}/diagnose`);
  if (!res.ok) throw new Error(`Diagnosis failed: ${res.status}`);
  return res.json();
}

export async function cleanDataset(datasetId: string, operationIds: string[]) {
  const res = await fetch(`${API_URL}/datasets/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, operation_ids: operationIds }),
  });
  if (!res.ok) throw new Error(`Clean failed: ${res.status}`);
  return res.json();
}

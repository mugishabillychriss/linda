// Thin client for the Doctor Linda FastAPI backend hosted on Render.
// Set NEXT_PUBLIC_API_URL in Vercel to your Render service URL, e.g.
// "https://doctor-linda-api.onrender.com"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "";
// Normalize: remove any trailing slash so we don't accidentally produce double slashes
const API_URL = RAW_API_URL.replace(/\/$/, "");

function buildUrl(path: string) {
  // Ensure path always starts with a slash
  return `${API_URL}${path.startsWith("/") ? path : "/" + path}`;
}

export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const url = buildUrl("/datasets/upload");
  console.log("POST", url);
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getDiagnosis(datasetId: string) {
  if (!datasetId) throw new Error("getDiagnosis requires a datasetId");
  const encoded = encodeURIComponent(datasetId);
  const url = buildUrl(`/datasets/${encoded}/diagnose`);
  console.log("GET", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Diagnosis failed: ${res.status}`);
  return res.json();
}

export async function cleanDataset(datasetId: string, operationIds: string[]) {
  if (!datasetId) throw new Error("cleanDataset requires a datasetId");
  const url = buildUrl("/datasets/clean");
  console.log("POST", url, { datasetId, operationIds });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, operation_ids: operationIds }),
  });
  if (!res.ok) throw new Error(`Clean failed: ${res.status}`);
  return res.json();
}

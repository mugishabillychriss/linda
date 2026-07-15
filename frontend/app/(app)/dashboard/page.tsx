"use client";

import { useState } from "react";
import { uploadDataset, getDiagnosis, cleanDataset } from "../../../lib/api";

export default function Home() {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [status, setStatus] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Uploading...");
    const { dataset_id } = await uploadDataset(file);
    setDatasetId(dataset_id);
    setStatus("Diagnosing...");
    const diag = await getDiagnosis(dataset_id);
    setDiagnosis(diag);
    setStatus("");
  }

  async function handleClean() {
    if (!datasetId || !diagnosis) return;
    setStatus("Cleaning...");
    const ops = diagnosis.problems.map((p: any) => p.operation_id);
    await cleanDataset(datasetId, ops);
    setStatus("Done -- cleaned dataset saved to Supabase Storage.");
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Upload a dataset</h1>
      <input type="file" accept=".csv,.xlsx,.json" onChange={handleUpload} />
      {status && <p className="mt-4 text-sm text-gray-500">{status}</p>}
      {diagnosis && (
        <div className="mt-6">
          <p className="font-semibold">Quality score: {diagnosis.quality_score}</p>
          <p className="mt-2">{diagnosis.summary}</p>
          <ul className="mt-4 list-disc pl-5">
            {diagnosis.problems.map((p: any, i: number) => (
              <li key={i} className="mb-2">
                <strong>{p.issue}</strong>: {p.recommended_fix}
              </li>
            ))}
          </ul>
          <button
            onClick={handleClean}
            className="mt-4 px-4 py-2 bg-black text-white rounded"
          >
            Apply recommended fixes
          </button>
        </div>
      )}
    </main>
  );
}

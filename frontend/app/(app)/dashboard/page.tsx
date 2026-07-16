"use client";

import { useState, useEffect, useCallback } from "react";
import {
  uploadDataset,
  getDiagnosis,
  cleanDataset,
  listDatasets,
  getDownloadUrl,
} from "../../../lib/api";
import Gauge from "../../../components/ui/Gauge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

type Step = "upload" | "diagnosing" | "diagnosed" | "cleaning" | "cleaned";

const STEP_ORDER: Step[] = ["upload", "diagnosing", "diagnosed", "cleaning", "cleaned"];
const STEP_LABELS: Record<Step, string> = {
  upload: "Upload",
  diagnosing: "Diagnose",
  diagnosed: "Diagnose",
  cleaning: "Clean",
  cleaned: "Download",
};

function currentStageIndex(step: Step) {
  if (step === "upload") return 0;
  if (step === "diagnosing" || step === "diagnosed") return 1;
  if (step === "cleaning") return 2;
  return 3;
}

export default function Dashboard() {
  const [step, setStep] = useState<Step>("upload");
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await listDatasets();
      setHistory(data || []);
    } catch {
      // Non-critical -- history is a convenience, not the core flow.
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setDiagnosis(null);
    setDownloadUrl(null);
    try {
      setStep("diagnosing");
      const { dataset_id } = await uploadDataset(file);
      setDatasetId(dataset_id);
      const diag = await getDiagnosis(dataset_id);
      setDiagnosis(diag);
      setStep("diagnosed");
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Something went wrong during upload/diagnosis.");
      setStep("upload");
    }
  }

  async function handleClean() {
    if (!datasetId || !diagnosis) return;
    setError("");
    try {
      setStep("cleaning");
      const ops = diagnosis.problems.map((p: any) => p.operation_id);
      await cleanDataset(datasetId, ops);
      const { url } = await getDownloadUrl(datasetId, "cleaned");
      setDownloadUrl(url);
      setStep("cleaned");
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Something went wrong while cleaning.");
      setStep("diagnosed");
    }
  }

  function reset() {
    setStep("upload");
    setDatasetId(null);
    setDiagnosis(null);
    setDownloadUrl(null);
    setError("");
  }

  const stageIdx = currentStageIndex(step);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[1fr_280px] gap-10">
      <div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(["Upload", "Diagnose", "Clean", "Download"] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                  i <= stageIdx ? "bg-signal text-white" : "bg-ink/10 text-slate"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${i <= stageIdx ? "text-ink" : "text-slate"}`}>
                {label}
              </span>
              {i < 3 && <div className="w-8 h-px bg-ink/10 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <Card className="p-4 mb-6 border-alert/30 bg-alert/5">
            <p className="text-sm text-alert">{error}</p>
          </Card>
        )}

        {/* Upload state */}
        {step === "upload" && (
          <Card className="p-10 text-center border-dashed">
            <p className="font-display text-lg font-semibold mb-2">Upload a dataset</p>
            <p className="text-slate text-sm mb-6">CSV, Excel (.xlsx), or JSON</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleUpload}
                className="hidden"
              />
              <span className="bg-signal text-white px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer hover:bg-signal-dark transition-colors">
                Choose file
              </span>
            </label>
          </Card>
        )}

        {/* Diagnosing */}
        {step === "diagnosing" && (
          <Card className="p-10 text-center">
            <p className="text-slate text-sm font-mono animate-pulse">
              Analyzing your dataset...
            </p>
          </Card>
        )}

        {/* Diagnosed */}
        {(step === "diagnosed" || step === "cleaning") && diagnosis && (
          <Card className="p-8">
            <div className="flex items-start gap-8 mb-6">
              <Gauge score={diagnosis.quality_score} size={160} label="current" />
              <div>
                <p className="text-sm text-slate mb-1">Estimated after cleaning</p>
                <p className="font-display text-3xl font-semibold text-mint">
                  {Math.round(diagnosis.estimated_quality_after_cleaning)}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6">{diagnosis.summary}</p>
            <div className="space-y-3 mb-6">
              {diagnosis.problems.map((p: any, i: number) => (
                <div key={i} className="border border-ink/10 rounded-md p-4">
                  <p className="font-medium text-sm mb-1">{p.issue}</p>
                  <p className="text-slate text-sm mb-2">{p.why_it_matters}</p>
                  <p className="font-mono text-xs text-signal">→ {p.recommended_fix}</p>
                </div>
              ))}
            </div>
            <Button onClick={handleClean} disabled={step === "cleaning"}>
              {step === "cleaning" ? "Cleaning..." : "Apply recommended fixes"}
            </Button>
          </Card>
        )}

        {/* Cleaned / done */}
        {step === "cleaned" && (
          <Card className="p-10 text-center">
            <p className="font-display text-lg font-semibold mb-2 text-mint">
              Your dataset is ready
            </p>
            <p className="text-slate text-sm mb-6">
              Cleaned and saved. Download it below.
            </p>
            <div className="flex gap-3 justify-center">
              {downloadUrl && (
                <a href={downloadUrl} download>
                  <Button>Download cleaned dataset</Button>
                </a>
              )}
              <Button variant="secondary" onClick={reset}>
                Clean another
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* History sidebar */}
      <div>
        <h2 className="font-display text-sm font-semibold text-slate uppercase tracking-wide mb-4">
          Past uploads
        </h2>
        <div className="space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-slate">Nothing yet -- your uploads will show up here.</p>
          )}
          {history.map((d) => (
            <Card key={d.id} className="p-4">
              <p className="text-sm font-medium truncate mb-1">{d.filename}</p>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-slate">
                  {d.row_count} rows
                </span>
                <span className="font-mono text-xs text-signal">
                  {Math.round(d.quality_score)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

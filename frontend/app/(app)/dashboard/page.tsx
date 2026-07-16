"use client";

import { useState, useEffect, useCallback } from "react";
import {
  uploadDataset,
  getDiagnosis,
  previewClean,
  cleanDataset,
  listDatasets,
  getDownloadUrl,
} from "../../../lib/api";
import Gauge from "../../../components/ui/Gauge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

type Step = "upload" | "diagnosing" | "diagnosed" | "cleaning" | "cleaned";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-alert/10 text-alert border-alert/30",
  high: "bg-alert/10 text-alert border-alert/20",
  medium: "bg-[#D6A93A]/10 text-[#8a6d1f] border-[#D6A93A]/30",
  low: "bg-mint/10 text-mint border-mint/30",
};

const DIMENSION_LABELS: Record<string, string> = {
  completeness: "Completeness",
  uniqueness: "Uniqueness",
  validity: "Validity",
  consistency: "Consistency",
  accuracy: "Accuracy",
  integrity: "Integrity",
  timeliness: "Timeliness",
};

function currentStageIndex(step: Step) {
  if (step === "upload") return 0;
  if (step === "diagnosing" || step === "diagnosed") return 1;
  if (step === "cleaning") return 2;
  return 3;
}

// Groups approved problems into { operation_ids, columns } shaped exactly
// how the backend's /preview and /clean endpoints expect them.
function buildOperationPayload(problems: any[], approved: Set<number>) {
  const opIds = new Set<string>();
  const columns: Record<string, string[]> = {};
  problems.forEach((p, i) => {
    if (!approved.has(i)) return;
    opIds.add(p.operation_id);
    if (p.column) {
      columns[p.operation_id] = columns[p.operation_id] || [];
      if (!columns[p.operation_id].includes(p.column)) {
        columns[p.operation_id].push(p.column);
      }
    }
  });
  return { operationIds: Array.from(opIds), columns };
}

export default function Dashboard() {
  const [step, setStep] = useState<Step>("upload");
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [previewChanges, setPreviewChanges] = useState<any[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

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
    setPreviewChanges(null);
    setReport(null);
    try {
      setStep("diagnosing");
      const { dataset_id } = await uploadDataset(file);
      setDatasetId(dataset_id);
      const diag = await getDiagnosis(dataset_id);
      setDiagnosis(diag);
      setApproved(new Set(diag.problems.map((_: any, i: number) => i)));
      setStep("diagnosed");
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Something went wrong during upload/diagnosis.");
      setStep("upload");
    }
  }

  function toggleApproved(i: number) {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    setPreviewChanges(null);
  }

  async function handlePreview() {
    if (!datasetId || !diagnosis) return;
    setError("");
    setPreviewing(true);
    try {
      const { operationIds, columns } = buildOperationPayload(diagnosis.problems, approved);
      const { changes } = await previewClean(datasetId, operationIds, columns);
      setPreviewChanges(changes);
    } catch (err: any) {
      setError(err.message || "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleApply() {
    if (!datasetId || !diagnosis) return;
    setError("");
    try {
      setStep("cleaning");
      const { operationIds, columns } = buildOperationPayload(diagnosis.problems, approved);
      const result = await cleanDataset(datasetId, operationIds, columns);
      setReport(result.report);
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
    setPreviewChanges(null);
    setReport(null);
    setError("");
  }

  const stageIdx = currentStageIndex(step);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[1fr_280px] gap-10">
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
          <div className="space-y-6">
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
              <p className="text-sm leading-relaxed">{diagnosis.summary}</p>

              {diagnosis.insights?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-ink/10">
                  <p className="text-xs font-mono uppercase tracking-wide text-slate mb-2">
                    Smart insights
                  </p>
                  <ul className="space-y-1.5">
                    {diagnosis.insights.map((insight: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-signal">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <p className="font-display font-semibold mb-4">
                Issues found -- uncheck anything you don&apos;t want fixed
              </p>
              <div className="space-y-3">
                {diagnosis.problems.map((p: any, i: number) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 border rounded-md p-4 cursor-pointer ${
                      SEVERITY_STYLES[p.severity] || "border-ink/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={approved.has(i)}
                      onChange={() => toggleApproved(i)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-ink">{p.issue}</span>
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-ink/5 text-slate">
                          {p.severity}
                        </span>
                        {p.column && (
                          <span className="font-mono text-[10px] text-slate">{p.column}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate mb-1">{p.why_it_matters}</p>
                      <p className="font-mono text-xs text-signal">→ {p.recommended_fix}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={previewing || approved.size === 0}
                >
                  {previewing ? "Loading preview..." : "Preview changes"}
                </Button>
                <Button onClick={handleApply} disabled={step === "cleaning" || approved.size === 0}>
                  {step === "cleaning" ? "Applying..." : "Apply approved fixes"}
                </Button>
              </div>
            </Card>

            {previewChanges && (
              <Card className="p-6">
                <p className="font-display font-semibold mb-4">
                  Preview ({previewChanges.length} sample changes)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-mono uppercase text-slate border-b border-ink/10">
                        <th className="pb-2 pr-4">Operation</th>
                        <th className="pb-2 pr-4">Column</th>
                        <th className="pb-2 pr-4">Before</th>
                        <th className="pb-2">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewChanges.map((c, i) => (
                        <tr key={i} className="border-b border-ink/5">
                          <td className="py-2 pr-4 font-mono text-xs text-slate">
                            {c.operation_id}
                          </td>
                          <td className="py-2 pr-4">{c.column || "—"}</td>
                          <td className="py-2 pr-4 text-alert">
                            {c.type === "row_count_change"
                              ? `${c.before_rows} rows`
                              : c.type === "column_added"
                              ? "(new column)"
                              : String(c.before ?? "∅")}
                          </td>
                          <td className="py-2 text-mint">
                            {c.type === "row_count_change"
                              ? `${c.after_rows} rows`
                              : c.type === "column_added"
                              ? c.sample_values?.join(", ")
                              : String(c.after ?? "∅")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Cleaned / done */}
        {step === "cleaned" && (
          <div className="space-y-6">
            <Card className="p-10 text-center">
              <p className="font-display text-lg font-semibold mb-2 text-mint">
                Your dataset is ready
              </p>
              <p className="text-slate text-sm mb-6">Cleaned and saved. Download it below.</p>
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

            {report && (
              <Card className="p-6">
                <p className="font-display font-semibold mb-4">Cleaning report</p>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-slate mb-1">Quality score</p>
                    <p className="font-mono text-sm">
                      {report.quality_score_before} → {report.quality_score_after}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate mb-1">Rows</p>
                    <p className="font-mono text-sm">
                      {report.rows_before} → {report.rows_after}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate mb-1">Issues remaining</p>
                    <p className="font-mono text-sm">
                      {report.issues_before} → {report.issues_after}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(report.dimensions_after).map(([key, val]) => {
                    if (val === null) return null;
                    const before = report.dimensions_before[key];
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate">{DIMENSION_LABELS[key] || key}</span>
                          <span className="font-mono text-slate">
                            {before} → {val as number}
                          </span>
                        </div>
                        <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-signal rounded-full"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
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
                <span className="font-mono text-xs text-slate">{d.row_count} rows</span>
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

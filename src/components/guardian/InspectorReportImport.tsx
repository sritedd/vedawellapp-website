"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

interface ExtractedDefect {
  title: string;
  description: string;
  location: string;
  severity: string;
  recommendation: string;
  selected: boolean;
}

interface ParseResult {
  inspectorName: string | null;
  inspectionDate: string | null;
  reportSummary: string | null;
  defects: ExtractedDefect[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 border-red-500/20",
  major: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  minor: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  cosmetic: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export default function InspectorReportImport({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setCreated(0);

    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 30);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: unknown) => (item as { str?: string }).str || "").join(" ") + "\n";
      }

      if (fullText.trim().length < 50) {
        setError("Could not extract text. Try a text-based PDF.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/guardian/parse-inspector-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: fullText, projectId }),
      });

      if (res.status === 403) {
        setError("Inspector report import requires a Pro subscription.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Parsing failed");
      }

      const data = await res.json();
      setResult({
        ...data,
        defects: (data.defects || []).map((d: Omit<ExtractedDefect, "selected">) => ({ ...d, selected: true })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleDefect = (index: number) => {
    if (!result) return;
    const updated = [...result.defects];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setResult({ ...result, defects: updated });
  };

  const createDefects = async () => {
    if (!result) return;
    const selected = result.defects.filter((d) => d.selected);
    if (selected.length === 0) return;

    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    let count = 0;
    let lastError: string | null = null;
    for (const defect of selected) {
      const { error } = await supabase.from("defects").insert({
        project_id: projectId,
        user_id: user.id,
        title: defect.title,
        description: `${defect.description}\n\nRecommendation: ${defect.recommendation}`,
        location: defect.location,
        stage: defect.location || "Imported",
        severity: defect.severity,
        status: "open",
        reported_date: result.inspectionDate || new Date().toISOString().split("T")[0],
      });
      if (!error) {
        count++;
      } else {
        lastError = error.message;
        console.error("[InspectorReportImport] insert failed:", error.message);
      }
    }

    setCreated(count);
    if (count < selected.length && lastError) {
      // Partial or total failure — surface it so the user knows some defects
      // didn't land instead of silently showing a lower count.
      setError(`${selected.length - count} of ${selected.length} defects failed to save: ${lastError}`);
    }
    setCreating(false);
  };

  const selectedCount = result?.defects.filter((d) => d.selected).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Inspector Report Import</h3>
        <p className="text-sm text-muted">
          Upload a building inspector PDF report — AI extracts defects and creates them in one click.
          <span className="ml-1 text-primary font-medium">Pro feature</span>
        </p>
      </div>

      {/* Upload */}
      <div className="card">
        <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="w-full py-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center gap-2">
          {loading ? (
            <>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted">Extracting defects from report...</span>
            </>
          ) : (
            <>
              <span className="text-3xl">🔍</span>
              <span className="text-sm font-medium">Upload Inspector Report PDF</span>
            </>
          )}
        </button>
        {error && <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded mt-3">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Report Summary */}
          <div className="card">
            <div className="text-sm space-y-1">
              {result.inspectorName && <div><span className="text-muted">Inspector:</span> <strong>{result.inspectorName}</strong></div>}
              {result.inspectionDate && <div><span className="text-muted">Date:</span> {result.inspectionDate}</div>}
              {result.reportSummary && <p className="text-muted mt-2">{result.reportSummary}</p>}
            </div>
          </div>

          {/* Extracted Defects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">{result.defects.length} Defects Found</h4>
              <span className="text-xs text-muted">{selectedCount} selected</span>
            </div>

            <div className="space-y-2">
              {result.defects.map((defect, i) => (
                <label key={i} className={`card flex gap-3 cursor-pointer transition-colors ${defect.selected ? "border-primary/30" : "opacity-60"}`}>
                  <input type="checkbox" checked={defect.selected} onChange={() => toggleDefect(i)} className="mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{defect.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[defect.severity] || ""}`}>
                        {defect.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{defect.description}</p>
                    {defect.location && <p className="text-xs text-muted mt-1">📍 {defect.location}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Create button */}
          {created > 0 ? (
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <p className="text-green-700 font-medium">Created {created} defects from inspector report</p>
            </div>
          ) : (
            <button onClick={createDefects} disabled={creating || selectedCount === 0}
              className="w-full px-4 py-3 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {creating ? "Creating defects..." : `Create ${selectedCount} Defect${selectedCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

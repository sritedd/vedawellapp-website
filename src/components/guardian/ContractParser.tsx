"use client";

import { useState, useRef } from "react";
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

interface ParsedContract {
  contractSum: number | null;
  builderName: string | null;
  builderLicense: string | null;
  builderABN: string | null;
  homeownerName: string | null;
  projectAddress: string | null;
  startDate: string | null;
  completionDate: string | null;
  contractSignedDate: string | null;
  insurancePolicyNumber: string | null;
  stages: { name: string; percentage: number }[];
  pcAllowances: { item: string; amount: number }[];
  psAllowances: { item: string; amount: number }[];
  coolingOffPeriod: string | null;
  warrantyPeriod: string | null;
  unusualClauses: string[];
  missingProtections: string[];
}

export default function ContractParser({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ParsedContract | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setFileName(file.name);
    setError("");
    setLoading(true);
    setResult(null);

    try {
      // Extract text from PDF using pdfjs-dist (dynamic import to avoid bundle bloat)
      setExtracting(true);
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 40);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: unknown) => (item as { str?: string }).str || "")
          .join(" ");
        fullText += pageText + "\n";
      }
      setExtracting(false);

      if (fullText.trim().length < 100) {
        setError("Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.");
        setLoading(false);
        return;
      }

      // Send to AI for parsing
      const res = await fetch("/api/guardian/parse-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: fullText, projectId }),
      });

      if (res.status === 403) {
        setError("Contract parsing requires a Pro subscription.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Parsing failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number | null) => n ? `$${n.toLocaleString()}` : "—";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Contract PDF Parser</h3>
        <p className="text-sm text-muted">
          Upload your building contract and AI will extract key details automatically.
          <span className="ml-1 text-primary font-medium">Pro feature</span>
        </p>
      </div>

      {/* Upload */}
      <div className="card">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full py-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted">{extracting ? "Extracting text from PDF..." : "AI is analysing your contract..."}</span>
            </>
          ) : (
            <>
              <span className="text-3xl">📄</span>
              <span className="text-sm font-medium">Click to upload contract PDF</span>
              <span className="text-xs text-muted">Text-based PDFs work best (not scanned images)</span>
            </>
          )}
        </button>
        {fileName && !loading && <p className="text-xs text-muted mt-2">Uploaded: {fileName}</p>}
        {error && <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded mt-3">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Key Details */}
          <div className="card">
            <h4 className="font-bold text-sm mb-3">Extracted Contract Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted">Contract Sum:</span> <strong>{formatCurrency(result.contractSum)}</strong></div>
              <div><span className="text-muted">Builder:</span> <strong>{result.builderName || "—"}</strong></div>
              <div><span className="text-muted">License:</span> {result.builderLicense || "—"}</div>
              <div><span className="text-muted">ABN:</span> {result.builderABN || "—"}</div>
              <div><span className="text-muted">Homeowner:</span> {result.homeownerName || "—"}</div>
              <div><span className="text-muted">Address:</span> {result.projectAddress || "—"}</div>
              <div><span className="text-muted">Start Date:</span> {result.startDate || "—"}</div>
              <div><span className="text-muted">Completion:</span> {result.completionDate || "—"}</div>
              <div><span className="text-muted">Signed:</span> {result.contractSignedDate || "—"}</div>
              <div><span className="text-muted">Insurance:</span> {result.insurancePolicyNumber || "—"}</div>
              <div><span className="text-muted">Cooling Off:</span> {result.coolingOffPeriod || "—"}</div>
              <div><span className="text-muted">Warranty:</span> {result.warrantyPeriod || "—"}</div>
            </div>
          </div>

          {/* Payment Stages */}
          {result.stages.length > 0 && (
            <div className="card">
              <h4 className="font-bold text-sm mb-2">Payment Stages</h4>
              <div className="space-y-1">
                {result.stages.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span>{s.name}</span>
                    <span className="font-medium">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PC/PS Allowances */}
          {(result.pcAllowances.length > 0 || result.psAllowances.length > 0) && (
            <div className="card">
              <h4 className="font-bold text-sm mb-2">Allowances</h4>
              {result.pcAllowances.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-muted mb-1">Prime Cost (PC)</h5>
                  {result.pcAllowances.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{a.item}</span>
                      <span>{formatCurrency(a.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.psAllowances.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted mb-1">Provisional Sum (PS)</h5>
                  {result.psAllowances.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{a.item}</span>
                      <span>{formatCurrency(a.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {result.unusualClauses.length > 0 && (
            <div className="card border-yellow-500/20 bg-yellow-500/5">
              <h4 className="font-bold text-sm mb-2 text-yellow-700">Unusual Clauses</h4>
              <ul className="space-y-1">
                {result.unusualClauses.map((c, i) => (
                  <li key={i} className="text-sm flex gap-2"><span>⚠️</span>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {result.missingProtections.length > 0 && (
            <div className="card border-red-500/20 bg-red-500/5">
              <h4 className="font-bold text-sm mb-2 text-red-700">Missing Protections</h4>
              <ul className="space-y-1">
                {result.missingProtections.map((m, i) => (
                  <li key={i} className="text-sm flex gap-2"><span>❌</span>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type ImportType = "defects" | "payments";

const TEMPLATES: Record<ImportType, { headers: string[]; example: string }> = {
  defects: {
    headers: ["title", "description", "location", "severity", "stage", "status"],
    example: "Cracked tile in ensuite,Tile cracked along grout line,Ensuite bathroom,minor,Fixing,open\nMissing insulation,Section of wall insulation missing behind bath,Bathroom,major,Pre-plasterboard,open",
  },
  payments: {
    headers: ["stage_name", "amount", "due_date", "status", "notes"],
    example: "Slab,45000,2026-04-15,pending,Foundation stage\nFrame,60000,2026-05-30,pending,Frame stage payment",
  },
};

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  });
}

export default function CSVImport({ projectId }: { projectId: string }) {
  const [importType, setImportType] = useState<ImportType>("defects");
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }
      setHeaders(rows[0]);
      setPreview(rows.slice(1, 6)); // Show first 5 data rows
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = TEMPLATES[importType];
    const csv = template.headers.join(",") + "\n" + template.example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guardian-${importType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }

    // Re-read the full file
    const file = fileRef.current?.files?.[0];
    if (!file) { setImporting(false); return; }

    const text = await file.text();
    const allRows = parseCSV(text);
    const dataRows = allRows.slice(1);

    let success = 0;
    let failed = 0;

    const expectedHeaders = TEMPLATES[importType].headers;

    for (const row of dataRows) {
      if (row.length < 2) continue;

      try {
        if (importType === "defects") {
          const obj: Record<string, unknown> = {
            project_id: projectId,
            user_id: user.id,
            title: row[headers.indexOf("title")] || row[0] || "Imported defect",
            description: row[headers.indexOf("description")] || row[1] || "",
            location: row[headers.indexOf("location")] || row[2] || "",
            severity: row[headers.indexOf("severity")] || row[3] || "minor",
            stage: row[headers.indexOf("stage")] || row[4] || "",
            status: row[headers.indexOf("status")] || row[5] || "open",
            reported_date: new Date().toISOString().split("T")[0],
          };
          const validSeverities = ["critical", "major", "minor", "cosmetic"];
          if (!validSeverities.includes(obj.severity as string)) obj.severity = "minor";

          const { error } = await supabase.from("defects").insert(obj);
          if (error) { failed++; } else { success++; }
        } else if (importType === "payments") {
          const obj = {
            project_id: projectId,
            user_id: user.id,
            stage_name: row[headers.indexOf("stage_name")] || row[0] || "Imported payment",
            amount: parseFloat(row[headers.indexOf("amount")] || row[1] || "0"),
            due_date: row[headers.indexOf("due_date")] || row[2] || null,
            status: row[headers.indexOf("status")] || row[3] || "pending",
            notes: row[headers.indexOf("notes")] || row[4] || "",
          };

          const { error } = await supabase.from("payments").insert(obj);
          if (error) { failed++; } else { success++; }
        }
      } catch {
        failed++;
      }
    }

    void expectedHeaders; // used for column mapping reference
    setResult({ success, failed });
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">CSV Import</h3>
        <p className="text-sm text-muted">Import defects or payments from a spreadsheet.</p>
      </div>

      {/* Type selector + template download */}
      <div className="flex items-center gap-3">
        <select value={importType} onChange={(e) => { setImportType(e.target.value as ImportType); setPreview(null); setResult(null); }}
          className="px-3 py-2 text-sm rounded border border-border bg-background">
          <option value="defects">Defects</option>
          <option value="payments">Payments</option>
        </select>
        <button onClick={downloadTemplate}
          className="px-3 py-2 text-sm rounded border border-border hover:border-primary transition-colors">
          Download Template CSV
        </button>
      </div>

      {/* File upload */}
      <div className="card">
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-6 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-sm font-medium">Upload CSV File</span>
          <span className="text-xs text-muted">Columns: {TEMPLATES[importType].headers.join(", ")}</span>
        </button>
        {error && <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded mt-3">{error}</p>}
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <h4 className="font-bold text-sm mb-2">Preview ({preview.length} rows shown)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded">
              <thead>
                <tr className="bg-muted/10">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-xs truncate max-w-[200px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleImport} disabled={importing}
            className="mt-4 w-full px-4 py-2.5 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {importing ? "Importing..." : `Import ${importType}`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg text-center ${result.failed > 0 ? "bg-yellow-500/10" : "bg-green-500/10"}`}>
          <p className="font-medium">
            Imported {result.success} {importType} successfully
            {result.failed > 0 && <span className="text-red-600"> ({result.failed} failed)</span>}
          </p>
        </div>
      )}
    </div>
  );
}

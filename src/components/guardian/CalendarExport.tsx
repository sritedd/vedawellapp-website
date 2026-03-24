"use client";

import { useState } from "react";

export default function CalendarExport({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [include, setInclude] = useState({
    inspections: true,
    payments: true,
    defects: true,
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      const categories = Object.entries(include)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");

      const res = await fetch(
        `/api/guardian/calendar-export?projectId=${projectId}&include=${categories}`
      );

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "guardian-calendar.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[CalendarExport]", err);
      alert("Failed to export calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📅</span>
        <div>
          <h3 className="font-bold">Export to Calendar</h3>
          <p className="text-sm text-muted">Download inspection dates, payment deadlines, and SLA dates as .ics</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        {(["inspections", "payments", "defects"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={include[key]}
              onChange={(e) => setInclude((prev) => ({ ...prev, [key]: e.target.checked }))}
              className="rounded border-border"
            />
            <span className="capitalize">{key === "defects" ? "SLA Deadlines" : key}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleExport}
        disabled={loading || !Object.values(include).some(Boolean)}
        className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exporting...
          </>
        ) : (
          <>📅 Download .ics File</>
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { DefectAnalysis } from "@/lib/ai/prompts";

interface AIDefectAssistProps {
  onApply: (analysis: DefectAnalysis) => void;
  currentDescription: string;
  stage?: string;
  state?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Critical" },
  major: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Major" },
  minor: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Minor" },
  cosmetic: { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-600 dark:text-gray-400", label: "Cosmetic" },
};

export default function AIDefectAssist({
  onApply,
  currentDescription,
  stage,
  state,
}: AIDefectAssistProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DefectAnalysis | null>(null);

  async function handleAnalyze() {
    if (!currentDescription.trim()) {
      setError("Please enter a defect description first.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/guardian/ai/describe-defect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: currentDescription,
          stage,
          state,
        }),
      });

      if (res.status === 401) {
        setError("Please sign in to use AI features.");
        return;
      }
      if (res.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
        return;
      }
      if (res.status === 503) {
        setError("AI features are currently unavailable.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data: DefectAnalysis = await res.json();
      setAnalysis(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (analysis) {
      onApply(analysis);
      setAnalysis(null);
    }
  }

  const severity = analysis
    ? SEVERITY_STYLES[analysis.severity] || SEVERITY_STYLES.minor
    : null;

  return (
    <div className="space-y-3">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !currentDescription.trim()}
        className="inline-flex items-center gap-1.5 rounded-md border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-600 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            Analyzing...
          </>
        ) : (
          <>
            <span aria-hidden="true">&#10024;</span>
            AI Assist
          </>
        )}
      </button>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <span aria-hidden="true">&#9888;</span>
          <span>{error}</span>
          <button
            type="button"
            onClick={handleAnalyze}
            className="ml-auto text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Analysis Result Card */}
      {analysis && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              AI Analysis
            </h4>
            <div className="flex items-center gap-2">
              {analysis.isUrgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  <span aria-hidden="true">&#9888;</span> Urgent
                </span>
              )}
              {severity && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text}`}
                >
                  {severity.label}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-3 px-4 py-3">
            {/* Improved Description */}
            {analysis.improvedDescription && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Improved Description
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {analysis.improvedDescription}
                </p>
              </div>
            )}

            {/* Category & Location */}
            <div className="grid grid-cols-2 gap-3">
              {analysis.category && (
                <div>
                  <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Category
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {analysis.category}
                  </p>
                </div>
              )}
              {analysis.location && (
                <div>
                  <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Location
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {analysis.location}
                  </p>
                </div>
              )}
            </div>

            {/* Recommended Action */}
            {analysis.recommendedAction && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Recommended Action
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {analysis.recommendedAction}
                </p>
              </div>
            )}

            {/* Australian Standard */}
            {analysis.australianStandard && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Australian Standard
                </p>
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  {analysis.australianStandard}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setAnalysis(null)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

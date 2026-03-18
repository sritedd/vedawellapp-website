"use client";

import { useState, useEffect, useCallback } from "react";

interface StageAdvice {
  advice: string;
  checklistItems: string[];
  documentsToDemand: string[];
  commonIssues: string[];
  paymentAdvice: string;
}

interface AIStageAdviceProps {
  stage: string;
  state: string;
  projectContext?: string;
}

export default function AIStageAdvice({
  stage,
  state,
  projectContext,
}: AIStageAdviceProps) {
  const [advice, setAdvice] = useState<StageAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAdvice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/guardian/ai/stage-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, state, projectContext }),
      });

      if (res.status === 401) {
        setError("Please sign in to use AI features.");
        return;
      }
      if (res.status === 503) {
        setError("AI features are not available at this time.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load advice. Please try again.");
        return;
      }

      const data: StageAdvice = await res.json();
      setAdvice(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [stage, state, projectContext]);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  // Loading skeleton
  if (loading && !advice) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-600 mt-4" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">&#x26A0;&#xFE0F;</span>
          <h3 className="font-semibold text-red-800 dark:text-red-300">
            AI Advice Unavailable
          </h3>
        </div>
        <p className="text-sm text-red-700 dark:text-red-400 mb-3">{error}</p>
        <button
          onClick={fetchAdvice}
          className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!advice) return null;

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x1F4A1;</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            AI Stage Advisor
          </span>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
            {stage}
          </span>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          {expanded ? "Hide" : "Show AI Advice"}
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-indigo-100 dark:border-indigo-800/50 space-y-5 pt-4">
          {/* Advice paragraphs */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {advice.advice.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Checklist */}
          {advice.checklistItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <span>&#x2705;</span> Checklist
              </h4>
              <ul className="space-y-1.5">
                {advice.checklistItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents to demand */}
          {advice.documentsToDemand.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <span>&#x1F4CB;</span> Documents to Demand
              </h4>
              <ul className="space-y-1 ml-1">
                {advice.documentsToDemand.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400 mt-1 flex-shrink-0">
                      &#x2022;
                    </span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common issues */}
          {advice.commonIssues.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3.5">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                <span>&#x26A0;&#xFE0F;</span> Common Issues to Watch For
              </h4>
              <ul className="space-y-1.5">
                {advice.commonIssues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2"
                  >
                    <span className="flex-shrink-0 mt-0.5">&#x2022;</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment advice */}
          {advice.paymentAdvice && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3.5">
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <span>&#x1F4B0;</span> Payment Guidance
              </h4>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {advice.paymentAdvice}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 dark:text-gray-500 italic pt-1">
            AI-generated advice for general guidance only. Consult a licensed
            building inspector or solicitor for professional advice specific to
            your project.
          </p>
        </div>
      )}
    </div>
  );
}

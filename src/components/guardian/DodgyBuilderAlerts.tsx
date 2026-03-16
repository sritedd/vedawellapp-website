"use client";

import { useState, useMemo } from "react";

interface Stage {
  id: string;
  name: string;
  description?: string;
  dodgyBuilderWarnings?: string[];
}

interface WorkflowData {
  workflows: Record<string, Record<string, { stages: Stage[] }>>;
}

interface DodgyBuilderAlertsProps {
  projectId: string;
  currentStage: string;
  stateCode?: string;
  buildCategory?: string;
}

// Severity levels based on warning indicator count
type Severity = "critical" | "high" | "standard";

function classifySeverity(warning: string): Severity {
  // Count leading warning indicators (red circle emoji \u{1F6A8})
  // Warnings with 3+ indicators = critical, 2 = high, 1 = standard
  const match = warning.match(/^(\u{1F6A8})+/u);
  if (!match) return "standard";
  const count = [...match[0]].filter((c) => c === "\u{1F6A8}").length;
  if (count >= 3) return "critical";
  if (count >= 2) return "high";
  return "standard";
}

function stripIndicators(warning: string): string {
  // Remove leading emoji indicators and whitespace
  return warning.replace(/^[\u{1F6A8}\s]+/u, "").trim();
}

function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "critical") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:bg-red-900/30 dark:text-red-400">
        CRITICAL
      </span>
    );
  }
  if (severity === "high") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
        HIGH RISK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      WARNING
    </span>
  );
}

function WarningCard({
  warning,
  variant = "current",
}: {
  warning: string;
  variant?: "current" | "next";
}) {
  const severity = classifySeverity(warning);
  const text = stripIndicators(warning);

  const isSevere = severity === "critical" || severity === "high";
  const isNext = variant === "next";

  const borderColor = isNext
    ? "border-slate-200 dark:border-slate-700"
    : isSevere
      ? "border-red-300 dark:border-red-800"
      : "border-amber-300 dark:border-amber-800";

  const bgColor = isNext
    ? "bg-slate-50 dark:bg-slate-800/50"
    : isSevere
      ? "bg-red-50 dark:bg-red-950/30"
      : "bg-amber-50 dark:bg-amber-950/30";

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} p-4 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {isNext ? (
            <span className="text-slate-400 dark:text-slate-500 text-lg">
              {"\u25CB"}
            </span>
          ) : isSevere ? (
            <span className="text-red-600 dark:text-red-400 text-lg">
              {"\u26A0"}
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 text-lg">
              {"\u25B2"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!isNext && <SeverityBadge severity={severity} />}
          </div>
          <p
            className={
              isNext
                ? "text-sm text-muted-foreground"
                : isSevere
                  ? "text-sm font-medium text-red-900 dark:text-red-200"
                  : "text-sm font-medium text-amber-900 dark:text-amber-200"
            }
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({
  stage,
  isOpen,
  onToggle,
  isCurrent,
}: {
  stage: Stage;
  isOpen: boolean;
  onToggle: () => void;
  isCurrent: boolean;
}) {
  const warnings = stage.dodgyBuilderWarnings ?? [];
  if (warnings.length === 0) return null;

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        isCurrent
          ? "border-red-300 dark:border-red-800"
          : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{stage.name}</span>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
            {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
          </span>
          {isCurrent && (
            <span className="text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 font-semibold">
              CURRENT
            </span>
          )}
        </div>
        <span
          className={`text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          {"\u25BC"}
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-2 bg-card">
          {warnings.map((w, i) => (
            <WarningCard key={i} warning={w} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DodgyBuilderAlerts({
  projectId,
  currentStage,
  stateCode = "NSW",
  buildCategory = "new_build",
}: DodgyBuilderAlertsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showAllStages, setShowAllStages] = useState(false);

  const { stages, currentStageData, nextStageData, error } = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const data: WorkflowData = require("@/data/australian-build-workflows.json");
      const workflow = data?.workflows?.[buildCategory]?.[stateCode];
      if (!workflow?.stages) {
        return {
          stages: [],
          currentStageData: null,
          nextStageData: null,
          error: `No workflow found for ${buildCategory} in ${stateCode}`,
        };
      }

      const allStages = workflow.stages;
      const currentIndex = allStages.findIndex((s) => s.id === currentStage);
      const current = currentIndex >= 0 ? allStages[currentIndex] : null;
      const next =
        currentIndex >= 0 && currentIndex < allStages.length - 1
          ? allStages[currentIndex + 1]
          : null;

      return {
        stages: allStages,
        currentStageData: current,
        nextStageData: next,
        error: currentIndex < 0 ? `Stage "${currentStage}" not found in workflow` : null,
      };
    } catch {
      return {
        stages: [],
        currentStageData: null,
        nextStageData: null,
        error: "Failed to load workflow data",
      };
    }
  }, [buildCategory, stateCode, currentStage]);

  const toggleSection = (stageId: string) => {
    setOpenSections((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const currentWarnings = currentStageData?.dodgyBuilderWarnings ?? [];
  const nextWarnings = nextStageData?.dodgyBuilderWarnings ?? [];

  return (
    <div className="space-y-6" data-project-id={projectId}>
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{"\u{1F6E1}"}</span>
          <h2 className="text-xl font-bold">Builder Red Flag Monitor</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Contextual warnings based on your current build stage. These are
          common tactics and oversights reported by Australian homeowners. Stay
          vigilant and document everything.
        </p>
      </div>

      {/* Current Stage Warnings */}
      {currentStageData && currentWarnings.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{"\u26A0"}</span>
            <h3 className="text-lg font-semibold">
              Current Stage: {currentStageData.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Watch for these red flags right now
          </p>
          <div className="space-y-3">
            {currentWarnings.map((warning, index) => (
              <WarningCard key={index} warning={warning} variant="current" />
            ))}
          </div>
        </div>
      )}

      {/* Next Stage Preview */}
      {nextStageData && nextWarnings.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg text-muted-foreground">{"\u{1F441}"}</span>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Coming Up: {nextStageData.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            What to watch for next
          </p>
          <div className="space-y-2">
            {nextWarnings.map((warning, index) => (
              <WarningCard key={index} warning={warning} variant="next" />
            ))}
          </div>
        </div>
      )}

      {/* Full Stage Accordion */}
      <div className="rounded-xl border border-border bg-card p-6">
        <button
          type="button"
          onClick={() => setShowAllStages(!showAllStages)}
          className="w-full flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{"\u{1F4CB}"}</span>
            <h3 className="text-lg font-semibold">All Stage Warnings</h3>
          </div>
          <span
            className={`text-muted-foreground transition-transform duration-200 text-sm ${
              showAllStages ? "rotate-180" : ""
            }`}
          >
            {"\u25BC"}
          </span>
        </button>
        <p className="text-sm text-muted-foreground mb-4">
          Expand to review warnings across every stage of your build
        </p>

        {showAllStages && (
          <div className="space-y-2">
            {stages.map((stage) => (
              <AccordionItem
                key={stage.id}
                stage={stage}
                isOpen={!!openSections[stage.id]}
                onToggle={() => toggleSection(stage.id)}
                isCurrent={stage.id === currentStage}
              />
            ))}
          </div>
        )}
      </div>

      {/* What to do guidance */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{"\u2139"}</span>
          <h3 className="text-lg font-semibold">
            What to do if you spot a red flag
          </h3>
        </div>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              1
            </span>
            <div>
              <span className="font-medium">
                Take timestamped photos immediately
              </span>
              <p className="text-muted-foreground mt-0.5">
                Photograph the issue with date/time visible. Multiple angles.
                Include context showing where it is on site.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              2
            </span>
            <div>
              <span className="font-medium">
                Send written notice to builder (email, not phone)
              </span>
              <p className="text-muted-foreground mt-0.5">
                Always communicate in writing. Phone calls are not evidence.
                Reference your contract clause if applicable.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              3
            </span>
            <div>
              <span className="font-medium">
                Contact your certifier/inspector
              </span>
              <p className="text-muted-foreground mt-0.5">
                Your private certifier or council building inspector can
                intervene if work is non-compliant.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              4
            </span>
            <div>
              <span className="font-medium">
                Document everything in your Guardian project
              </span>
              <p className="text-muted-foreground mt-0.5">
                Upload photos, log communications, and track defects. This
                creates your evidence trail.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              5
            </span>
            <div>
              <span className="font-medium">
                Consider a stop-work notice if safety is at risk
              </span>
              <p className="text-muted-foreground mt-0.5">
                If you believe work is unsafe or structurally unsound, you may
                have grounds for a stop-work direction. Seek legal advice.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}

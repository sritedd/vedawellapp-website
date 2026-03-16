"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */

interface GuidedOnboardingProps {
  projectId: string;
  projectName: string;
  builderName: string;
  onDismiss: () => void;
  onNavigateTab: (tabId: string) => void;
}

interface OnboardingState {
  completedSteps: number[];
  dismissed: boolean;
  minimized: boolean;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  actionLabel: string;
  actionType: "tab" | "external";
  actionTarget: string;
}

/* ─── LocalStorage helpers ─── */

function storageKey(projectId: string): string {
  return `onboarding-${projectId}`;
}

function loadState(projectId: string): OnboardingState {
  if (typeof window === "undefined") {
    return { completedSteps: [], dismissed: false, minimized: false };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (raw) {
      const parsed = JSON.parse(raw) as OnboardingState;
      return {
        completedSteps: Array.isArray(parsed.completedSteps)
          ? parsed.completedSteps
          : [],
        dismissed: Boolean(parsed.dismissed),
        minimized: Boolean(parsed.minimized),
      };
    }
  } catch {
    // corrupted — reset
  }
  return { completedSteps: [], dismissed: false, minimized: false };
}

function saveState(projectId: string, state: OnboardingState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(projectId), JSON.stringify(state));
}

/** Check whether the onboarding should be shown for a given project. */
export function shouldShowOnboarding(projectId: string): boolean {
  if (typeof window === "undefined") return false;
  const state = loadState(projectId);
  return !state.dismissed && state.completedSteps.length < 5;
}

/* ─── Steps definition ─── */

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Review Your Project Details",
    description:
      "Make sure your builder name, license number, ABN, and insurance details are correct",
    actionLabel: "Go to Settings",
    actionType: "tab",
    actionTarget: "settings",
  },
  {
    id: 2,
    title: "Upload Your Building Contract",
    description:
      "Keep your contract safe in the Document Vault for easy reference during disputes",
    actionLabel: "Go to Documents",
    actionType: "tab",
    actionTarget: "documents",
  },
  {
    id: 3,
    title: "Check Your Builder\u2019s License",
    description:
      "Verify your builder is properly licensed in your state \u2014 it takes 30 seconds",
    actionLabel: "Verify License",
    actionType: "external",
    actionTarget: "", // resolved at render time from project state
  },
  {
    id: 4,
    title: "Understand Your Current Stage",
    description:
      "Your Smart Dashboard shows what to focus on right now based on your build stage",
    actionLabel: "View Dashboard",
    actionType: "tab",
    actionTarget: "overview",
  },
  {
    id: 5,
    title: "Set Up Weekly Check-ins",
    description:
      "Log your builder\u2019s responsiveness each week \u2014 this builds your accountability record",
    actionLabel: "Start Check-ins",
    actionType: "tab",
    actionTarget: "checkins",
  },
];

/* ─── Component ─── */

export default function GuidedOnboarding({
  projectId,
  projectName,
  builderName,
  onDismiss,
  onNavigateTab,
}: GuidedOnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    dismissed: false,
    minimized: false,
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const loaded = loadState(projectId);
    setState(loaded);
    setDontShowAgain(loaded.dismissed);
    setMounted(true);
  }, [projectId]);

  // Persist on every change (after mount)
  useEffect(() => {
    if (!mounted) return;
    saveState(projectId, state);
  }, [state, projectId, mounted]);

  const completedCount = state.completedSteps.length;
  const progressPct = (completedCount / STEPS.length) * 100;

  const completeStep = useCallback(
    (stepId: number) => {
      setState((prev) => {
        if (prev.completedSteps.includes(stepId)) return prev;
        return { ...prev, completedSteps: [...prev.completedSteps, stepId] };
      });
    },
    [],
  );

  const handleAction = useCallback(
    (step: OnboardingStep) => {
      completeStep(step.id);
      if (step.actionType === "tab") {
        onNavigateTab(step.actionTarget);
      }
      // external links are handled via <a> tag — no JS navigation needed
    },
    [completeStep, onNavigateTab],
  );

  const handleDismiss = useCallback(() => {
    const newState: OnboardingState = {
      ...state,
      dismissed: dontShowAgain,
    };
    saveState(projectId, newState);
    onDismiss();
  }, [state, dontShowAgain, projectId, onDismiss]);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, minimized: !prev.minimized }));
  }, []);

  // Don't render server-side or when dismissed
  if (!mounted) return null;
  if (state.dismissed) return null;

  /* ─── Minimized view ─── */
  if (state.minimized) {
    return (
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={toggleMinimize}
          className="flex w-full items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              Getting Started
            </span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{STEPS.length} complete
            </span>
          </div>
          {/* Chevron down */}
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    );
  }

  /* ─── Full view ─── */
  return (
    <div
      className="mb-6 rounded-xl border border-border shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.85) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            Welcome to {projectName}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Complete these 5 steps to get the most out of Guardian for your build
            with {builderName}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Minimize */}
          <button
            type="button"
            onClick={toggleMinimize}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Minimize onboarding"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75l7.5-7.5 7.5 7.5"
              />
            </svg>
          </button>
          {/* Close */}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close onboarding"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedCount} of {STEPS.length} steps complete
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1 p-5">
        {STEPS.map((step) => {
          const isCompleted = state.completedSteps.includes(step.id);
          const firstIncomplete = STEPS.find(
            (s) => !state.completedSteps.includes(s.id),
          );
          const isActive = !isCompleted && firstIncomplete?.id === step.id;

          return (
            <div
              key={step.id}
              className={`flex gap-3 rounded-lg p-3 transition-colors ${
                isActive
                  ? "bg-primary/5 ring-1 ring-primary/20"
                  : isCompleted
                    ? "opacity-75"
                    : ""
              }`}
            >
              {/* Step number / check */}
              <div className="flex shrink-0 pt-0.5">
                {isCompleted ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.description}
                </p>

                {/* Action button — only shown if not completed */}
                {!isCompleted && (
                  <div className="mt-2">
                    {step.actionType === "external" ? (
                      <a
                        href={
                          step.actionTarget ||
                          "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing-and-registrations/public-register"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => completeStep(step.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {step.actionLabel}
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAction(step)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {step.actionLabel}
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — don't show again */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Don&apos;t show again
        </label>
        {completedCount === STEPS.length && (
          <span className="text-xs font-medium text-green-600">
            All done &mdash; you&apos;re ready to go!
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccountabilityScoreProps {
  projectId: string;
  builderName?: string;
}

interface CheckInRow {
  id: string;
  project_id: string;
  builder_responsive: boolean | null;
  received_update: boolean | null;
  notes: string | null;
  created_at: string;
}

interface DefectRow {
  id: string;
  project_id: string;
  status: string;
  severity: string;
  created_at: string;
}

interface VariationRow {
  id: string;
  project_id: string;
  status: string;
  reason_category: string | null;
  created_at: string;
}

interface SubScore {
  label: string;
  score: number;
  max: number;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weeksBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Needs Improvement";
  return "Concerning";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green-500
  if (score >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function scoreBgClass(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextClass(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

function calcCommunication(checkIns: CheckInRow[]): SubScore {
  if (checkIns.length === 0) {
    return {
      label: "Communication",
      score: 0,
      max: 40,
      explanation: "No weekly check-ins have been logged yet.",
    };
  }

  const dates = checkIns.map((c) => new Date(c.created_at));
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const totalWeeks = weeksBetween(earliest, new Date());

  const responsiveWeeks = checkIns.filter((c) => c.builder_responsive === true).length;
  const updateWeeks = checkIns.filter((c) => c.received_update === true).length;

  // Base: (responsive / total) * 40, bonus capped so total never exceeds 40
  const base = (responsiveWeeks / totalWeeks) * 40;
  const bonus = (updateWeeks / totalWeeks) * 5;
  const score = clamp(Math.round(base + bonus), 0, 40);

  return {
    label: "Communication",
    score,
    max: 40,
    explanation:
      responsiveWeeks === 0
        ? "Builder has not been responsive in any logged week."
        : `Builder was responsive in ${responsiveWeeks} of ${totalWeeks} week${totalWeeks === 1 ? "" : "s"}.`,
  };
}

function calcDefectResolution(defects: DefectRow[]): SubScore {
  if (defects.length === 0) {
    return {
      label: "Defect Resolution",
      score: 35,
      max: 35,
      explanation: "No defects recorded \u2014 benefit of the doubt applied.",
    };
  }

  const resolved = defects.filter(
    (d) => d.status === "rectified" || d.status === "verified"
  ).length;
  const base = (resolved / defects.length) * 35;

  const openCriticalMajor = defects.filter(
    (d) =>
      (d.severity === "critical" || d.severity === "major") &&
      d.status !== "rectified" &&
      d.status !== "verified"
  ).length;

  const penalty = openCriticalMajor * 5;
  const score = clamp(Math.round(base - penalty), 0, 35);

  return {
    label: "Defect Resolution",
    score,
    max: 35,
    explanation: `${resolved} of ${defects.length} defect${defects.length === 1 ? "" : "s"} resolved.${
      openCriticalMajor > 0
        ? ` ${openCriticalMajor} critical/major defect${openCriticalMajor === 1 ? " is" : "s are"} still open.`
        : ""
    }`,
  };
}

function calcVariationTransparency(variations: VariationRow[]): SubScore {
  if (variations.length === 0) {
    return {
      label: "Variation Transparency",
      score: 25,
      max: 25,
      explanation: "No variations recorded \u2014 benefit of the doubt applied.",
    };
  }

  const approved = variations.filter((v) => v.status === "approved").length;
  const base = (approved / variations.length) * 25;

  const hasBuilderError = variations.some(
    (v) => v.reason_category === "builder_error"
  );
  const penalty = hasBuilderError ? 10 : 0;

  const score = clamp(Math.round(base - penalty), 0, 25);

  return {
    label: "Variation Transparency",
    score,
    max: 25,
    explanation: `${approved} of ${variations.length} variation${variations.length === 1 ? "" : "s"} approved.${
      hasBuilderError ? " Builder-error variation detected \u2014 penalty applied." : ""
    }`,
  };
}

// ---------------------------------------------------------------------------
// Circular gauge (CSS-only)
// ---------------------------------------------------------------------------

function CircularGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = clamp(score, 0, 100) / 100;
  const offset = circumference * (1 - pct);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        {/* background track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/20"
          strokeWidth="10"
        />
        {/* score arc */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const overall = max > 0 ? (score / max) * 100 : 0;
  const bgClass = scoreBgClass(overall);

  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={`h-2 rounded-full ${bgClass}`}
        style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-score card
// ---------------------------------------------------------------------------

function SubScoreCard({ sub }: { sub: SubScore }) {
  const pct = sub.max > 0 ? Math.round((sub.score / sub.max) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{sub.label}</h4>
        <span className={`text-sm font-bold ${scoreTextClass(pct)}`}>
          {sub.score}/{sub.max}
        </span>
      </div>
      <ProgressBar score={sub.score} max={sub.max} />
      <p className="text-xs text-muted-foreground">{sub.explanation}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tips
// ---------------------------------------------------------------------------

function getTip(lowestArea: string): string {
  switch (lowestArea) {
    case "Communication":
      return "Log weekly check-ins to track builder responsiveness.";
    case "Defect Resolution":
      return "Follow up on open defects \u2014 send written reminders.";
    case "Variation Transparency":
      return "Request written quotes before approving variations.";
    default:
      return "Keep logging data to maintain an accurate score.";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AccountabilityScore({
  projectId,
  builderName,
}: AccountabilityScoreProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subScores, setSubScores] = useState<SubScore[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [trend, setTrend] = useState<"up" | "down" | "stable" | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch all three data sources in parallel
      const [checkInsRes, defectsRes, variationsRes] = await Promise.all([
        supabase
          .from("weekly_checkins")
          .select("id, project_id, builder_responsive, received_update, notes, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        supabase
          .from("defects")
          .select("id, project_id, status, severity, created_at")
          .eq("project_id", projectId),
        supabase
          .from("variations")
          .select("id, project_id, status, reason_category, created_at")
          .eq("project_id", projectId),
      ]);

      if (checkInsRes.error) throw checkInsRes.error;
      if (defectsRes.error) throw defectsRes.error;
      if (variationsRes.error) throw variationsRes.error;

      const checkIns = (checkInsRes.data ?? []) as CheckInRow[];
      const defects = (defectsRes.data ?? []) as DefectRow[];
      const variations = (variationsRes.data ?? []) as VariationRow[];

      // Calculate sub-scores
      const comm = calcCommunication(checkIns);
      const defect = calcDefectResolution(defects);
      const vari = calcVariationTransparency(variations);

      const subs = [comm, defect, vari];
      const total = clamp(comm.score + defect.score + vari.score, 0, 100);

      setSubScores(subs);
      setTotalScore(total);

      // Trend: compare current score with score computed from data >= 4 weeks ago
      if (checkIns.length > 0) {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const oldCheckIns = checkIns.filter(
          (c) => new Date(c.created_at) <= fourWeeksAgo
        );
        const oldDefects = defects.filter(
          (d) => new Date(d.created_at) <= fourWeeksAgo
        );
        const oldVariations = variations.filter(
          (v) => new Date(v.created_at) <= fourWeeksAgo
        );

        if (oldCheckIns.length > 0) {
          const oldTotal =
            calcCommunication(oldCheckIns).score +
            calcDefectResolution(oldDefects).score +
            calcVariationTransparency(oldVariations).score;
          const oldClamped = clamp(oldTotal, 0, 100);

          if (total > oldClamped + 2) setTrend("up");
          else if (total < oldClamped - 2) setTrend("down");
          else setTrend("stable");
        } else {
          setTrend(null);
        }
      } else {
        setTrend(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load accountability data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Determine the lowest-scoring area for tips
  const lowestSub =
    subScores.length > 0
      ? subScores.reduce((prev, curr) => {
          const prevPct = prev.max > 0 ? prev.score / prev.max : 1;
          const currPct = curr.max > 0 ? curr.score / curr.max : 1;
          return currPct < prevPct ? curr : prev;
        })
      : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-[140px] h-[140px] rounded-full bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm underline text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Builder Accountability Score</h3>
          {builderName && (
            <p className="text-sm text-muted-foreground">{builderName}</p>
          )}
        </div>
        {trend !== null && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === "up"
                ? "bg-green-100 text-green-700"
                : trend === "down"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {trend === "up" && (
              <span aria-label="Trending up">{"\u2191"}</span>
            )}
            {trend === "down" && (
              <span aria-label="Trending down">{"\u2193"}</span>
            )}
            {trend === "stable" && (
              <span aria-label="Stable">{"\u2194"}</span>
            )}
            {trend === "up"
              ? "Improving"
              : trend === "down"
                ? "Declining"
                : "Stable"}
          </span>
        )}
      </div>

      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-2">
        <CircularGauge score={totalScore} />
        <span
          className={`text-sm font-semibold ${scoreTextClass(totalScore)}`}
        >
          {scoreLabel(totalScore)}
        </span>
      </div>

      {/* Sub-score cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {subScores.map((sub) => (
          <SubScoreCard key={sub.label} sub={sub} />
        ))}
      </div>

      {/* Tips */}
      {lowestSub && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-1">
            {"\u2139"} Tip
          </h4>
          <p className="text-sm text-blue-700">{getTip(lowestSub.label)}</p>
        </div>
      )}
    </div>
  );
}

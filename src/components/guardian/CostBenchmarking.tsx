"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";
import type { Variation } from "@/types/guardian";

/* ── State cost multipliers (NSW = baseline) ── */
const STATE_MULTIPLIERS: Record<string, number> = {
  NSW: 1.0,
  VIC: 0.95,
  QLD: 0.9,
  WA: 1.05,
  SA: 0.85,
};

/* ── Benchmark data (AUD, 2024-2025) ── */
interface BenchmarkItem {
  keywords: string[];
  label: string;
  low: number;
  high: number;
  unit: string;
}

interface BenchmarkCategory {
  label: string;
  items: BenchmarkItem[];
}

const BENCHMARKS: BenchmarkCategory[] = [
  {
    label: "Electrical",
    items: [
      { keywords: ["power point", "powerpoint", "gpo"], label: "Additional power point", low: 150, high: 350, unit: "per item" },
      { keywords: ["downlight", "down light"], label: "Downlight", low: 80, high: 200, unit: "per item" },
      { keywords: ["switchboard", "switch board", "electrical board"], label: "Switchboard upgrade", low: 800, high: 2000, unit: "per item" },
    ],
  },
  {
    label: "Plumbing",
    items: [
      { keywords: ["tap", "faucet", "mixer"], label: "Tap replacement", low: 200, high: 500, unit: "per item" },
      { keywords: ["drain", "drainage"], label: "Additional drain point", low: 400, high: 900, unit: "per item" },
      { keywords: ["hot water", "hotwater", "hwu", "hw system"], label: "Hot water upgrade", low: 2000, high: 5000, unit: "per item" },
    ],
  },
  {
    label: "Structural",
    items: [
      { keywords: ["non-load", "non load", "nonload", "partition wall"], label: "Wall removal (non-load-bearing)", low: 500, high: 1500, unit: "per item" },
      { keywords: ["load-bearing", "load bearing", "loadbearing", "structural wall"], label: "Wall removal (load-bearing)", low: 3000, high: 8000, unit: "per item" },
      { keywords: ["window", "enlarge window", "window opening"], label: "Window enlargement", low: 2000, high: 6000, unit: "per item" },
    ],
  },
  {
    label: "Finishes",
    items: [
      { keywords: ["tile", "tiling", "splashback tile"], label: "Upgrade tiles", low: 30, high: 120, unit: "per sqm" },
      { keywords: ["benchtop", "bench top", "countertop", "stone bench"], label: "Upgrade benchtop", low: 200, high: 800, unit: "per LM" },
      { keywords: ["floor", "flooring", "timber floor", "laminate"], label: "Upgrade flooring", low: 40, high: 150, unit: "per sqm" },
    ],
  },
  {
    label: "External",
    items: [
      { keywords: ["concrete", "slab", "driveway", "path"], label: "Additional concrete", low: 80, high: 200, unit: "per sqm" },
      { keywords: ["retaining", "retaining wall"], label: "Retaining wall", low: 300, high: 800, unit: "per LM" },
      { keywords: ["fence", "fencing"], label: "Fence", low: 100, high: 400, unit: "per LM" },
    ],
  },
  {
    label: "General",
    items: [
      { keywords: ["provisional sum", "provisional"], label: "Provisional sum adjustment", low: 0, high: 0, unit: "variable" },
      { keywords: ["prime cost", "pc item", "pc sum"], label: "Prime cost adjustment", low: 0, high: 0, unit: "variable" },
      { keywords: ["site condition", "site conditions", "unforeseen", "rock", "soil"], label: "Site conditions", low: 500, high: 5000, unit: "per item" },
    ],
  },
];

/* ── Traffic-light assessment ── */
type TrafficLight = "green" | "amber" | "red" | "unknown";

interface VariationAssessment {
  variation: Variation;
  matchedBenchmark: BenchmarkItem | null;
  categoryLabel: string;
  light: TrafficLight;
  adjustedLow: number;
  adjustedHigh: number;
}

function matchBenchmark(title: string): { item: BenchmarkItem; categoryLabel: string } | null {
  const lower = title.toLowerCase();
  for (const cat of BENCHMARKS) {
    for (const item of cat.items) {
      for (const kw of item.keywords) {
        if (lower.includes(kw)) {
          return { item, categoryLabel: cat.label };
        }
      }
    }
  }
  return null;
}

function assessVariation(
  variation: Variation,
  multiplier: number
): VariationAssessment {
  const match = matchBenchmark(variation.title);
  if (!match || match.item.high === 0) {
    return {
      variation,
      matchedBenchmark: match?.item ?? null,
      categoryLabel: match?.categoryLabel ?? "",
      light: "unknown",
      adjustedLow: 0,
      adjustedHigh: 0,
    };
  }

  const adjustedLow = Math.round(match.item.low * multiplier);
  const adjustedHigh = Math.round(match.item.high * multiplier);
  const cost = variation.additional_cost;

  let light: TrafficLight = "green";
  if (cost > adjustedHigh * 1.3) {
    light = "red";
  } else if (cost > adjustedHigh * 1.1) {
    light = "amber";
  } else if (cost > adjustedHigh) {
    // within 0-10% above — still amber-ish but we'll be generous and call it amber
    light = "amber";
  }

  return {
    variation,
    matchedBenchmark: match.item,
    categoryLabel: match.categoryLabel,
    light,
    adjustedLow,
    adjustedHigh,
  };
}

function overallSpendLight(percent: number): TrafficLight {
  if (percent <= 5) return "green";
  if (percent <= 15) return "amber";
  return "red";
}

/* ── Styling helpers ── */
const LIGHT_STYLES: Record<TrafficLight, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Within range" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Above range" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Well above range" },
  unknown: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", label: "No benchmark" },
};

const TIPS: string[] = [
  "Always request itemized quotes (labour + materials + margin)",
  "Builder margin is typically 15-25% \u2014 anything higher, ask why",
  "Get independent quotes for variations over $5,000",
  "Provisional sum adjustments should come with receipts",
  "\"Site conditions\" is the #1 excuse for unjustified extras",
];

/* ── Component ── */
export default function CostBenchmarking({
  projectId,
  contractValue = 0,
  stateCode = "NSW",
}: {
  projectId: string;
  contractValue?: number;
  stateCode?: string;
}) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVariations = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("variations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching variations:", fetchError);
        setError("Failed to load variations.");
      } else {
        setVariations(data || []);
      }
      setLoading(false);
    };

    fetchVariations();
  }, [projectId]);

  const multiplier = STATE_MULTIPLIERS[stateCode.toUpperCase()] ?? 1.0;
  const assessments = variations.map((v) => assessVariation(v, multiplier));
  const totalVariationCost = variations.reduce((sum, v) => sum + (v.additional_cost || 0), 0);
  const variationPercent = contractValue > 0 ? (totalVariationCost / contractValue) * 100 : 0;
  const spendLight = overallSpendLight(variationPercent);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground">Loading cost benchmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-1">Cost Benchmarking</h2>
        <p className="text-sm text-muted-foreground">
          Compare your variation costs against 2024-25 Australian industry benchmarks
          {stateCode !== "NSW" && (
            <span>
              {" "}(adjusted for {stateCode.toUpperCase()}, multiplier: {multiplier}x)
            </span>
          )}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Variation Spend Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Variations</p>
            <p className="text-2xl font-bold">{formatMoney(totalVariationCost)}</p>
          </div>
          {contractValue > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">% of Contract</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold">{variationPercent.toFixed(1)}%</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LIGHT_STYLES[spendLight].bg} ${LIGHT_STYLES[spendLight].text}`}
                >
                  {spendLight === "green"
                    ? "Healthy"
                    : spendLight === "amber"
                      ? "Monitor"
                      : "High"}
                </span>
              </div>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Industry Average</p>
            <p className="text-lg font-medium">5 - 15% of contract</p>
            <p className="text-xs text-muted-foreground">(new builds)</p>
          </div>
        </div>
      </div>

      {/* Variation Analysis Table */}
      <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
        <h3 className="font-semibold mb-4">Per-Variation Analysis</h3>
        {assessments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No variations recorded yet. Add variations in the Variations tab to see benchmarking analysis.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Variation</th>
                <th className="pb-2 pr-4 font-medium">Cost</th>
                <th className="pb-2 pr-4 font-medium">Benchmark Match</th>
                <th className="pb-2 pr-4 font-medium">Typical Range</th>
                <th className="pb-2 font-medium">Assessment</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const style = LIGHT_STYLES[a.light];
                return (
                  <tr
                    key={a.variation.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium">{a.variation.title}</p>
                      {a.variation.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {a.variation.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap font-medium">
                      {formatMoney(a.variation.additional_cost)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {a.matchedBenchmark ? (
                        <span>
                          {a.categoryLabel} &mdash; {a.matchedBenchmark.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No match
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {a.matchedBenchmark && a.adjustedHigh > 0 ? (
                        <span>
                          {formatMoney(a.adjustedLow)} &ndash;{" "}
                          {formatMoney(a.adjustedHigh)}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({a.matchedBenchmark.unit})
                          </span>
                        </span>
                      ) : a.matchedBenchmark ? (
                        <span className="text-muted-foreground italic">
                          Variable
                        </span>
                      ) : (
                        <span>&mdash;</span>
                      )}
                    </td>
                    <td className="py-3">
                      {a.light === "unknown" ? (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                          No benchmark available &mdash; request itemized quote
                        </span>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tips Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3">
          [!] Tips for Negotiating Variations
        </h3>
        <ul className="space-y-2">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 font-bold mt-0.5 shrink-0">
                {i + 1}.
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

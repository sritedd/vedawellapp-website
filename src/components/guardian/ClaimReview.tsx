"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReviewResult {
  verdict: "PAY" | "HOLD" | "DISPUTE";
  confidence: number;
  reasons: string[];
  missingItems: string[];
  suggestedResponse: string;
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  PAY: { bg: "bg-green-500/10", text: "text-green-700", icon: "✅", label: "SAFE TO PAY" },
  HOLD: { bg: "bg-yellow-500/10", text: "text-yellow-700", icon: "⚠️", label: "HOLD PAYMENT" },
  DISPUTE: { bg: "bg-red-500/10", text: "text-red-700", icon: "❌", label: "DISPUTE" },
};

export default function ClaimReview({ projectId }: { projectId: string }) {
  const [claimAmount, setClaimAmount] = useState("");
  const [claimStage, setClaimStage] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check if user has pro access
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier, trial_ends_at, is_admin")
        .eq("id", user.id)
        .single();
      const tier = data?.subscription_tier || "free";
      const trialActive = tier === "trial" && data?.trial_ends_at && new Date(data.trial_ends_at) > new Date();
      setIsPro(tier === "guardian_pro" || data?.is_admin === true || !!trialActive);
    });

    // Fetch project stages for dropdown
    supabase
      .from("projects")
      .select("state, build_type")
      .eq("id", projectId)
      .single()
      .then(({ data }: { data: { state?: string; build_type?: string } | null }) => {
        const defaultStages = [
          "Site Preparation", "Slab / Foundation", "Frame", "Lock-up",
          "Enclosed / Rough-in", "Fixing", "Practical Completion", "Final"
        ];
        setStages(defaultStages);
        void data; // state-specific stages can be loaded in future
      });
  }, [projectId]);

  const handleReview = async () => {
    if (!claimAmount || !claimStage) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/guardian/ai/claim-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          claimAmount: parseFloat(claimAmount),
          claimStage,
          claimDescription: claimDescription || undefined,
        }),
      });

      if (res.status === 403) {
        setError("This feature requires a Pro subscription. Upgrade to unlock AI Claim Review.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!result?.suggestedResponse) return;
    await navigator.clipboard.writeText(result.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verdictStyle = result ? VERDICT_STYLES[result.verdict] : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Progress Claim Review</h3>
        <p className="text-sm text-muted">
          AI-powered analysis of your builder&apos;s progress claim.
          {!isPro && <span className="ml-1 text-primary font-medium">Pro feature</span>}
        </p>
      </div>

      {/* Input Form */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Claimed Amount ($)</label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              placeholder="e.g. 45000"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Stage Claimed</label>
            <select
              value={claimStage}
              onChange={(e) => setClaimStage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
            >
              <option value="">— Select stage —</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Notes / Description (optional)</label>
          <textarea
            value={claimDescription}
            onChange={(e) => setClaimDescription(e.target.value)}
            placeholder="Any details about the claim..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background resize-none"
          />
        </div>

        <button
          onClick={handleReview}
          disabled={loading || !claimAmount || !claimStage}
          className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analysing Claim...
            </>
          ) : (
            "Review This Claim"
          )}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && verdictStyle && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className={`p-6 rounded-lg border text-center ${verdictStyle.bg}`}>
            <div className="text-4xl mb-2">{verdictStyle.icon}</div>
            <div className={`text-2xl font-bold ${verdictStyle.text}`}>{verdictStyle.label}</div>
            <div className="mt-2 text-sm text-muted">
              Confidence: {result.confidence}%
              <div className="w-full max-w-xs mx-auto mt-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.confidence >= 70 ? "bg-green-500" : result.confidence >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reasons */}
          {result.reasons.length > 0 && (
            <div className="card">
              <h4 className="font-bold text-sm mb-2">Analysis</h4>
              <ul className="space-y-1">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Items */}
          {result.missingItems.length > 0 && (
            <div className="card border-yellow-500/20 bg-yellow-500/5">
              <h4 className="font-bold text-sm mb-2 text-yellow-700">Missing Before Payment</h4>
              <ul className="space-y-1">
                {result.missingItems.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span>⬜</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Response */}
          {result.suggestedResponse && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">Suggested Response to Builder</h4>
                <button
                  onClick={copyResponse}
                  className="px-3 py-1 text-xs rounded bg-primary text-white hover:opacity-90"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap bg-muted/10 p-3 rounded border border-border">
                {result.suggestedResponse}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

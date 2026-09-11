"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/tools/ToolLayout";
import { trackToolUse } from "@/lib/analytics";
import australianData from "@/data/australian-build-workflows.json";
import {
    getStateInsuranceConfig,
    getLicenseVerificationUrl,
    getLicenseVerificationLabel,
    getCoolingOffConfig,
} from "@/lib/guardian/calculations";

/**
 * Public progress-claim checker — no account, no login (guide/19 §1.4).
 *
 * This is the front door. The question an anxious owner types at 10pm with a
 * claim in their inbox is "should I pay my builder's progress claim" — and the
 * calculations that answer it already exist inside Guardian. Here they are,
 * for anyone, computed in the browser from the same state workflow data the
 * product uses.
 *
 * Nothing is sent anywhere: this page makes no network calls with the figures.
 */

interface Stage {
    name: string;
    paymentPercentage?: number;
    certificates?: string[];
    inspections?: string[];
}

const STATES = (australianData as unknown as {
    states: Array<{ code: string; name: string }>;
}).states;

const WORKFLOWS = (australianData as unknown as {
    workflows: Record<string, Record<string, { stages?: Stage[]; depositPercentage?: number }>>;
}).workflows;

const money = (n: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(
        Number.isFinite(n) ? n : 0
    );

export default function ProgressClaimCheck() {
    const [stateCode, setStateCode] = useState("NSW");
    const [contractSum, setContractSum] = useState("");
    const [stageName, setStageName] = useState("");
    const [claimAmount, setClaimAmount] = useState("");
    const [checked, setChecked] = useState(false);

    const workflow = WORKFLOWS.new_build?.[stateCode];
    const stages = useMemo(
        () => (workflow?.stages ?? []).filter((s) => (s.paymentPercentage ?? 0) > 0),
        [workflow]
    );
    const depositPct = workflow?.depositPercentage ?? 0;

    const sum = Math.max(0, parseFloat(contractSum) || 0);
    const claimed = Math.max(0, parseFloat(claimAmount) || 0);
    const stage = stages.find((s) => s.name === stageName);
    const expectedPct = stage?.paymentPercentage ?? 0;
    const expected = Math.round((expectedPct / 100) * sum);
    const overBy = claimed - expected;
    // A claim is "as expected" within a dollar of rounding; beyond 2% of the
    // contract sum it is a different conversation, not a rounding difference.
    const tolerance = Math.max(1, Math.round(sum * 0.02));
    const verdict = !claimed || Math.abs(overBy) <= tolerance ? "matches" : overBy > 0 ? "over" : "under";

    const insurance = getStateInsuranceConfig(stateCode);
    const cooling = getCoolingOffConfig(stateCode);

    const canCheck = sum > 0 && !!stage;

    function handleCheck() {
        setChecked(true);
        trackToolUse("progress-claim-check");
    }

    return (
        <ToolLayout
            title="Progress Claim Checker"
            description="Your builder has sent a progress claim. Before you pay it: what the stage is normally worth in your state, the certificates you should already hold, and the questions to ask."
        >
            <div className="space-y-6">
                {/* Inputs */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">1. Your state</label>
                        <div className="flex flex-wrap gap-2">
                            {STATES.map((s) => (
                                <button
                                    key={s.code}
                                    type="button"
                                    onClick={() => { setStateCode(s.code); setStageName(""); setChecked(false); }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${stateCode === s.code
                                        ? "bg-primary text-white border-primary"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    {s.code}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="sum" className="block text-sm font-medium mb-2">2. Contract sum ($)</label>
                            <input
                                id="sum"
                                type="number"
                                inputMode="numeric"
                                value={contractSum}
                                onChange={(e) => { setContractSum(e.target.value); setChecked(false); }}
                                placeholder="e.g. 650000"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="claim" className="block text-sm font-medium mb-2">
                                4. Amount claimed ($) <span className="font-normal text-muted-foreground">— optional</span>
                            </label>
                            <input
                                id="claim"
                                type="number"
                                inputMode="numeric"
                                value={claimAmount}
                                onChange={(e) => { setClaimAmount(e.target.value); setChecked(false); }}
                                placeholder="what the invoice says"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stage" className="block text-sm font-medium mb-2">3. Stage being claimed</label>
                        <select
                            id="stage"
                            value={stageName}
                            onChange={(e) => { setStageName(e.target.value); setChecked(false); }}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Choose the stage on the invoice…</option>
                            {stages.map((s) => (
                                <option key={s.name} value={s.name}>
                                    {s.name} — {s.paymentPercentage}%
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleCheck}
                        disabled={!canCheck}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
                    >
                        Check this claim
                    </button>
                </div>

                {/* Result */}
                {checked && stage && (
                    <div className="space-y-4">
                        <div
                            className={`rounded-xl border p-5 ${verdict === "over"
                                ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                                : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                                }`}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {stage.name} in {stateCode}
                            </p>
                            <h2 className="text-2xl font-bold mt-1">
                                {expectedPct}% — {money(expected)}
                            </h2>
                            {claimed > 0 && (
                                <p className="mt-1 text-sm">
                                    {verdict === "matches" && <>Your builder claimed {money(claimed)}. That matches the usual amount for this stage.</>}
                                    {verdict === "over" && <><strong>Your builder claimed {money(claimed)} — {money(Math.abs(overBy))} more</strong> than this stage usually carries. That is not automatically wrong (variations, a different schedule), but ask for it in writing.</>}
                                    {verdict === "under" && <>Your builder claimed {money(claimed)}, which is {money(Math.abs(overBy))} less than this stage usually carries.</>}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                                Typical schedule for {stateCode}
                                {depositPct > 0 && <> (after a {depositPct}% deposit)</>}. Your own contract is what binds — check its payment schedule against this.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold mb-2">Certificates you should already hold</h3>
                                {stage.certificates?.length ? (
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {stage.certificates.map((c) => (
                                            <li key={c} className="flex gap-2"><span aria-hidden="true">☐</span>{c}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No certificate is specific to this stage in {stateCode} — but you should still hold the builder&apos;s insurance certificate.</p>
                                )}
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold mb-2">Inspections that should have happened</h3>
                                {stage.inspections?.length ? (
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {stage.inspections.map((i) => (
                                            <li key={i} className="flex gap-2"><span aria-hidden="true">☐</span>{i}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No mandatory inspection is tied to this stage in {stateCode}. An independent inspection before you pay is still the cheapest insurance you can buy.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <h3 className="font-semibold mb-3">Ask your builder, in writing</h3>
                            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                                <li>Can you send the certificates and inspection results for {stage.name} before I pay this claim?</li>
                                <li>Does this claim include any variation? If so, which one, and where is the signed variation?</li>
                                <li>Which clause of our contract sets this stage at {expectedPct}%{claimed > 0 && verdict === "over" && <> — and what accounts for the extra {money(Math.abs(overBy))}?</>}</li>
                            </ol>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Asking in writing is the point: it is the record if this ever gets disputed.
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5 text-sm space-y-2">
                            <h3 className="font-semibold">While you are here</h3>
                            <p className="text-muted-foreground">
                                Check your builder is licensed on{" "}
                                <a href={getLicenseVerificationUrl(stateCode)} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                    {getLicenseVerificationLabel(stateCode)}
                                </a>
                                .
                            </p>
                            {insurance && (
                                <p className="text-muted-foreground">
                                    {stateCode} requires {insurance.scheme} on work over {money(insurance.threshold)}. Your builder should have given you the certificate before taking a deposit.
                                </p>
                            )}
                            {cooling && cooling.days > 0 && (
                                <p className="text-muted-foreground">
                                    If you have only just signed: {stateCode} has a {cooling.days} business day cooling-off period ({cooling.note}).
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                            <h3 className="font-semibold">Keep this for the whole build</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                HomeOwner Guardian runs this check at every claim, tracks which certificates you actually hold, and keeps the record if things go wrong. Free for one build.
                            </p>
                            <Link
                                href="/guardian/projects/new"
                                className="mt-3 inline-block px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm"
                            >
                                Save this as a project
                            </Link>
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    General information for Australian homeowners, not legal advice, and not a substitute for an independent
                    building inspection. Payment stages come from each state&apos;s standard residential schedule; your contract
                    is what binds. Figures verified September 2026 —{" "}
                    <Link href="/guardian/legal-notice" className="underline">read the full notice</Link>.
                    Nothing you type here leaves your browser.
                </p>
            </div>
        </ToolLayout>
    );
}

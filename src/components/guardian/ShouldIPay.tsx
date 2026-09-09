"use client";

import { useState, useEffect } from "react";
import LegalNotice from "@/components/guardian/LegalNotice";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";

interface ShouldIPayProps {
    projectId: string;
    contractValue: number;
    currentStage: string;
    onNavigateTab: (tabId: string) => void;
}

interface PaymentRow {
    id: string;
    stage_name: string;
    percentage: number;
    amount: number;
    status: string;
    certificates_required: string[];
}

interface BlockerItem {
    type: "certificate" | "inspection" | "defect";
    label: string;
    tab: string;
}

export default function ShouldIPay({ projectId, contractValue, currentStage, onNavigateTab }: ShouldIPayProps) {
    const [loading, setLoading] = useState(true);
    const [nextPayment, setNextPayment] = useState<PaymentRow | null>(null);
    const [blockers, setBlockers] = useState<BlockerItem[]>([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [fetchError, setFetchError] = useState(false);
    // Nothing recorded yet → "pre-flight" framing (guide/19 §1.2). The verdict is
    // computed from payments, certificates, inspections and defects, all empty on
    // a new project; without this the first thing a new user saw was
    // "DO NOT PAY" in red for having done nothing yet.
    const [evidenceCount, setEvidenceCount] = useState(0);
    // Unpaid claims for stages the owner told us are already complete. We do not
    // invent a "paid" record for them — we point at the right next claim and
    // say how many earlier ones are unrecorded, so the totals stay honest.
    const [earlierUnrecorded, setEarlierUnrecorded] = useState(0);

    useEffect(() => {
        async function analyse() {
            const supabase = createClient();

            // 1. Get next unpaid payment milestone
            const { data: payments, error: paymentsErr } = await supabase
                .from("payments")
                .select("id, stage_name, percentage, amount, status, certificates_required")
                .eq("project_id", projectId)
                .order("percentage", { ascending: true });

            if (paymentsErr) {
                console.error("[ShouldIPay] payments fetch failed:", paymentsErr.message);
                setFetchError(true);
                setLoading(false);
                return;
            }

            if (!payments || payments.length === 0) {
                setLoading(false);
                return;
            }

            const paid = (payments as PaymentRow[]).filter((p: PaymentRow) => p.status === "paid");
            setTotalPaid(paid.reduce((s: number, p: PaymentRow) => s + (p.amount || 0), 0));

            // Stages already marked completed (the wizard sets these from "Where is
            // the build now?"). Their claims are in the past whether or not the
            // owner has recorded them here, so they are not "the next claim".
            const { data: doneStages, error: stagesErr } = await supabase
                .from("stages")
                .select("name")
                .eq("project_id", projectId)
                .in("status", ["completed", "verified"]);
            if (stagesErr) {
                console.error("[ShouldIPay] stages fetch failed:", stagesErr.message);
            }
            const doneNames = new Set((doneStages || []).map((r: { name: string }) => r.name));
            const unpaid = (payments as PaymentRow[]).filter((p: PaymentRow) => p.status !== "paid");
            const earlier = unpaid.filter((p: PaymentRow) => doneNames.has(p.stage_name));
            setEarlierUnrecorded(earlier.length);

            const next = unpaid.find((p: PaymentRow) => !doneNames.has(p.stage_name)) ?? unpaid[0] ?? undefined;
            if (!next) {
                setNextPayment(null);
                setLoading(false);
                return;
            }
            setNextPayment(next);

            const issues: BlockerItem[] = [];
            // Track whether any blocker-check query failed. If so we must NOT
            // show "Safe to Pay" — a silent read failure could otherwise
            // green-light a payment that actually has open certs/defects.
            let checkFailed = false;

            // How much has been recorded at all? Drives the pre-flight framing.
            const { count: certCount } = await supabase
                .from("certifications")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId)
                .in("status", ["uploaded", "verified"]);
            setEvidenceCount((certCount || 0) + paid.length);

            // 2. Check required certificates
            if (next.certificates_required?.length > 0) {
                const { data: certs, error: certsErr } = await supabase
                    .from("certifications")
                    .select("type, status")
                    .eq("project_id", projectId);

                if (certsErr) {
                    console.error("[ShouldIPay] certifications fetch failed:", certsErr.message);
                    checkFailed = true;
                } else {
                    for (const reqCert of next.certificates_required) {
                        const norm = reqCert.toLowerCase().replace(/[^a-z]/g, "_");
                        const found = (certs || []).find((c: { type: string; status: string }) => {
                            const cNorm = c.type.toLowerCase().replace(/[^a-z]/g, "_");
                            return cNorm === norm && (c.status === "uploaded" || c.status === "verified");
                        });
                        if (!found) {
                            issues.push({ type: "certificate", label: reqCert, tab: "certificates" });
                        }
                    }
                }
            }

            // 3. Check for failed inspections at current stage
            const { data: inspections, error: inspectionsErr } = await supabase
                .from("inspections")
                .select("stage, result")
                .eq("project_id", projectId)
                .eq("result", "failed");

            if (inspectionsErr) {
                console.error("[ShouldIPay] inspections fetch failed:", inspectionsErr.message);
                checkFailed = true;
            } else if (inspections && inspections.length > 0) {
                for (const insp of inspections) {
                    issues.push({
                        type: "inspection",
                        label: `${insp.stage} inspection failed`,
                        tab: "inspections",
                    });
                }
            }

            // 4. Check for critical/major open defects
            const { data: defects, error: defectsErr } = await supabase
                .from("defects")
                .select("title, severity")
                .eq("project_id", projectId)
                .in("severity", ["critical", "major"])
                .not("status", "in", "(verified,rectified)");

            if (defectsErr) {
                console.error("[ShouldIPay] defects fetch failed:", defectsErr.message);
                checkFailed = true;
            } else if (defects && defects.length > 0) {
                for (const d of defects) {
                    issues.push({
                        type: "defect",
                        label: `${d.severity}: ${d.title}`,
                        tab: "defects",
                    });
                }
            }

            if (checkFailed) {
                setFetchError(true);
            }
            setBlockers(issues);
            setLoading(false);
        }

        analyse();
    }, [projectId, currentStage]);

    if (loading) {
        return (
            <div className="animate-pulse h-28 rounded-2xl bg-muted/30" />
        );
    }

    // Query failed — refuse to render a verdict because a silent read error
    // could otherwise show "Safe to Pay" against missing cert/defect data.
    if (fetchError) {
        return (
            <button
                onClick={() => onNavigateTab("payments")}
                className="w-full p-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800 text-left transition-transform active:scale-[0.99]"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">
                            Verdict Unavailable
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                            Could not verify payment readiness. Refresh to try again — do NOT pay until all checks load.
                        </p>
                    </div>
                </div>
            </button>
        );
    }

    // No payment milestones configured
    if (!nextPayment) {
        const allPaid = totalPaid > 0;
        return (
            <button
                onClick={() => onNavigateTab("payments")}
                className="w-full p-5 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800 text-left transition-transform active:scale-[0.99]"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                            {allPaid ? "All Payments Complete" : "No Payment Milestones Set Up"}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                            {allPaid
                                ? `${formatMoney(totalPaid)} paid of ${formatMoney(contractValue)} contract`
                                : "Tap to set up your payment schedule"}
                        </p>
                    </div>
                </div>
            </button>
        );
    }

    const isSafe = blockers.length === 0;
    const onlyPaperwork = blockers.every((b) => b.type === "certificate");
    const preflight = !isSafe && evidenceCount === 0 && onlyPaperwork;

    if (preflight) {
        // Nothing is wrong yet — these are the documents to collect before this
        // claim. Same rules as the verdict below, framed as a checklist rather
        // than a refusal.
        return (
            <div className="space-y-3">
                <button
                    onClick={() => onNavigateTab("payments")}
                    className="w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 dark:border-amber-800"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                            {blockers.length}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Your next claim</p>
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
                                {nextPayment.stage_name} — {formatMoney(nextPayment.amount)} ({nextPayment.percentage}%)
                            </h3>
                            <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-300">
                                Not ready to pay yet — {blockers.length} document{blockers.length !== 1 ? "s" : ""} to have in hand first. Nothing is wrong; the record just starts here.
                            </p>
                        </div>
                    </div>
                </button>
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">Before you pay this claim, you should hold:</h4>
                    {blockers.map((b, i) => (
                        <button
                            key={i}
                            onClick={() => onNavigateTab(b.tab)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors text-left group"
                        >
                            <span className="flex-shrink-0 w-5 h-5 rounded border border-amber-400" aria-hidden="true" />
                            <span className="text-sm text-amber-900 dark:text-amber-200 flex-1">{b.label}</span>
                            <span className="text-xs text-amber-700 dark:text-amber-300">Upload</span>
                        </button>
                    ))}
                    {earlierUnrecorded > 0 && (
                        <p className="text-xs text-muted-foreground pt-1">
                            {earlierUnrecorded} earlier claim{earlierUnrecorded !== 1 ? "s" : ""} not recorded as paid — update them in Progress claims so your totals are right.
                        </p>
                    )}
                </div>
                <LegalNotice compact className="px-1" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* The mega-button verdict */}
            <button
                onClick={() => onNavigateTab("payments")}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                    isSafe
                        ? "border-green-300 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800"
                        : "border-red-300 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30 dark:border-red-800"
                }`}
            >
                <div className="flex items-center gap-4">
                    {/* Big circle icon */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSafe ? "bg-green-500" : "bg-red-500"
                    }`}>
                        {isSafe ? (
                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-bold ${isSafe ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                                {isSafe ? "Safe to pay" : "Hold payment"}
                            </h3>
                        </div>
                        <p className={`text-sm mt-0.5 ${isSafe ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                            {isSafe
                                ? `${nextPayment.stage_name} — ${formatMoney(nextPayment.amount)} (${nextPayment.percentage}%)`
                                : `${blockers.length} issue${blockers.length !== 1 ? "s" : ""} must be resolved before paying ${nextPayment.stage_name}`
                            }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Paid so far: {formatMoney(totalPaid)} of {formatMoney(contractValue)}
                            {earlierUnrecorded > 0 && ` · ${earlierUnrecorded} earlier claim${earlierUnrecorded !== 1 ? "s" : ""} not recorded`}
                        </p>
                    </div>

                    <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </button>

            {/* Blocker list — only shown when NOT safe */}
            {!isSafe && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">
                        Resolve before paying:
                    </h4>
                    {blockers.map((b, i) => (
                        <button
                            key={i}
                            onClick={() => onNavigateTab(b.tab)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors text-left group"
                        >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300">
                                {b.type === "certificate" ? "C" : b.type === "inspection" ? "I" : "D"}
                            </span>
                            <span className="text-sm text-red-700 dark:text-red-400 flex-1 truncate">
                                {b.label}
                            </span>
                            <svg className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ))}
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-1">
                        Your right to withhold payment is protected under Australian construction law.
                    </p>
                </div>
            )}

            <LegalNotice compact className="px-1" />
        </div>
    );
}

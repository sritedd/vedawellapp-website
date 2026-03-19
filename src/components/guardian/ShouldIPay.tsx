"use client";

import { useState, useEffect } from "react";
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

    useEffect(() => {
        async function analyse() {
            const supabase = createClient();

            // 1. Get next unpaid payment milestone
            const { data: payments } = await supabase
                .from("payments")
                .select("id, stage_name, percentage, amount, status, certificates_required")
                .eq("project_id", projectId)
                .order("percentage", { ascending: true });

            if (!payments || payments.length === 0) {
                setLoading(false);
                return;
            }

            const paid = (payments as PaymentRow[]).filter((p: PaymentRow) => p.status === "paid");
            setTotalPaid(paid.reduce((s: number, p: PaymentRow) => s + (p.amount || 0), 0));

            const next = (payments as PaymentRow[]).find((p: PaymentRow) => p.status !== "paid");
            if (!next) {
                setNextPayment(null);
                setLoading(false);
                return;
            }
            setNextPayment(next);

            const issues: BlockerItem[] = [];

            // 2. Check required certificates
            if (next.certificates_required?.length > 0) {
                const { data: certs } = await supabase
                    .from("certifications")
                    .select("type, status")
                    .eq("project_id", projectId);

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

            // 3. Check for failed inspections at current stage
            const { data: inspections } = await supabase
                .from("inspections")
                .select("stage, result")
                .eq("project_id", projectId)
                .eq("result", "failed");

            if (inspections && inspections.length > 0) {
                for (const insp of inspections) {
                    issues.push({
                        type: "inspection",
                        label: `${insp.stage} inspection failed`,
                        tab: "inspections",
                    });
                }
            }

            // 4. Check for critical/major open defects
            const { data: defects } = await supabase
                .from("defects")
                .select("title, severity")
                .eq("project_id", projectId)
                .in("severity", ["critical", "major"])
                .not("status", "in", "(verified,rectified)");

            if (defects && defects.length > 0) {
                for (const d of defects) {
                    issues.push({
                        type: "defect",
                        label: `${d.severity}: ${d.title}`,
                        tab: "defects",
                    });
                }
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

    // No payment milestones configured
    if (!nextPayment) {
        const allPaid = totalPaid > 0;
        return (
            <button
                onClick={() => onNavigateTab("payments")}
                className="w-full p-5 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800 text-left transition-transform active:scale-[0.99]"
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

    return (
        <div className="space-y-3">
            {/* The mega-button verdict */}
            <button
                onClick={() => onNavigateTab("payments")}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                    isSafe
                        ? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800"
                        : "border-red-300 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-800"
                }`}
            >
                <div className="flex items-center gap-4">
                    {/* Big circle icon */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSafe ? "bg-green-500" : "bg-red-500 animate-pulse"
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
                                {isSafe ? "Safe to Pay" : "DO NOT PAY"}
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
        </div>
    );
}

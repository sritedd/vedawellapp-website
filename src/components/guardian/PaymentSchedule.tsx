"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    calculatePaymentAmount,
    calculateTotalPaid,
    calculateRemainingBalance,
    findNextPaymentDue,
    PaymentMilestone as UtilMilestone,
} from "@/lib/guardian/calculations";

interface PaymentMilestone {
    id: string;
    stage: string;
    percentage: number;
    amount: number;
    status: "pending" | "due" | "paid";
    due_date: string | null;
    paid_date: string | null;
    certificates_required: string[];
    certificates_received: string[];
}

interface PaymentScheduleProps {
    projectId: string;
    contractValue: number;
}

const DEFAULT_STAGES = [
    { stage: "Deposit", percentage: 5, certificates_required: [] },
    { stage: "Base/Slab", percentage: 15, certificates_required: ["Footing Inspection"] },
    { stage: "Frame", percentage: 20, certificates_required: ["Frame Inspection"] },
    { stage: "Lockup/Enclosed", percentage: 20, certificates_required: ["EICC Rough-in"] },
    { stage: "Fixing", percentage: 15, certificates_required: ["Plumbing Certificate"] },
    { stage: "Practical Completion", percentage: 20, certificates_required: ["EICC Final", "Plumbing Final", "Waterproofing"] },
    { stage: "Final Payment", percentage: 5, certificates_required: ["Occupation Certificate"] },
];

export default function PaymentSchedule({ projectId, contractValue }: PaymentScheduleProps) {
    const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMilestones();
    }, [projectId]);

    const fetchMilestones = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("payment_milestones")
            .select("*")
            .eq("project_id", projectId)
            .order("percentage", { ascending: true });

        if (!error && data && data.length > 0) {
            setMilestones(data);
        } else {
            // Generate default milestones
            const defaultMilestones: PaymentMilestone[] = DEFAULT_STAGES.map((s, idx) => ({
                id: `milestone-${idx}`,
                stage: s.stage,
                percentage: s.percentage,
                amount: calculatePaymentAmount(contractValue, s.percentage),
                status: idx === 0 ? "paid" : idx === 1 ? "due" : "pending",
                due_date: null,
                paid_date: idx === 0 ? new Date().toISOString() : null,
                certificates_required: s.certificates_required,
                certificates_received: idx === 0 ? s.certificates_required : [],
            }));
            setMilestones(defaultMilestones);
        }
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate totals using tested utility functions
    const totalPaid = calculateTotalPaid(milestones as UtilMilestone[]);
    const nextDue = findNextPaymentDue(milestones as UtilMilestone[]);
    const remainingBalance = calculateRemainingBalance(contractValue, totalPaid);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">💰 Payment Schedule</h2>
                <p className="text-muted-foreground">
                    Track progress payments linked to construction stages.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="text-sm text-muted-foreground">Contract Value</div>
                    <div className="text-2xl font-bold">{formatCurrency(contractValue)}</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="text-sm text-green-700">Paid to Date</div>
                    <div className="text-2xl font-bold text-green-800">
                        {formatCurrency(totalPaid)}
                    </div>
                    <div className="text-xs text-green-600">
                        {Math.round((totalPaid / contractValue) * 100)}% of contract
                    </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="text-sm text-amber-700">Next Payment</div>
                    <div className="text-2xl font-bold text-amber-800">
                        {nextDue ? formatCurrency(nextDue.amount) : "—"}
                    </div>
                    <div className="text-xs text-amber-600">
                        {nextDue ? `${nextDue.stage} (${nextDue.percentage}%)` : "None due"}
                    </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-700">Remaining Balance</div>
                    <div className="text-2xl font-bold text-blue-800">
                        {formatCurrency(remainingBalance)}
                    </div>
                </div>
            </div>

            {/* Payment Blocking Warning */}
            {nextDue && (nextDue.certificates_required?.length || 0) > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-red-800 mb-2">
                        ⚠️ Before Paying {nextDue.stage} Stage
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                        Ensure you have received the following certificates:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                        {(nextDue.certificates_required || []).map((cert, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                {(nextDue.certificates_received || []).includes(cert) ? (
                                    <span className="text-green-600">✓</span>
                                ) : (
                                    <span className="text-red-600">✗</span>
                                )}
                                {cert}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Payment Progress</span>
                    <span>{Math.round((totalPaid / contractValue) * 100)}%</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
                    {milestones.map((milestone, idx) => (
                        <div
                            key={milestone.id}
                            className={`h-full transition-all ${milestone.status === "paid"
                                ? "bg-green-500"
                                : milestone.status === "due"
                                    ? "bg-amber-500"
                                    : "bg-gray-300"
                                }`}
                            style={{ width: `${milestone.percentage}%` }}
                            title={`${milestone.stage}: ${milestone.percentage}%`}
                        />
                    ))}
                </div>
            </div>

            {/* Milestone Table */}
            <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/20">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">%</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Certificates</th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map((milestone, idx) => (
                            <tr
                                key={milestone.id}
                                className={`border-t border-border ${milestone.status === "due" ? "bg-amber-50" : ""
                                    }`}
                            >
                                <td className="px-4 py-3 font-medium">{milestone.stage}</td>
                                <td className="px-4 py-3">{milestone.percentage}%</td>
                                <td className="px-4 py-3">{formatCurrency(milestone.amount)}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${milestone.status === "paid"
                                            ? "bg-green-100 text-green-700"
                                            : milestone.status === "due"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {milestone.status === "paid"
                                            ? "✓ Paid"
                                            : milestone.status === "due"
                                                ? "⏳ Due"
                                                : "Upcoming"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {(milestone.certificates_required?.length || 0) > 0 ? (
                                        <span className="text-muted-foreground">
                                            {(milestone.certificates_required || []).join(", ")}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* NSW Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">📋 NSW Payment Rules</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Deposit cannot exceed 10% of contract value</li>
                    <li>• Progress payments must be linked to completed stages</li>
                    <li>• Final payment (5%) held until Occupation Certificate issued</li>
                    <li>• Never pay ahead of completed work</li>
                </ul>
            </div>
        </div>
    );
}

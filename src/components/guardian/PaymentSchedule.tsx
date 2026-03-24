"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Payment } from "@/types/guardian";

interface PaymentScheduleProps {
    projectId: string;
    contractValue: number;
}

export default function PaymentSchedule({ projectId, contractValue }: PaymentScheduleProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [certifications, setCertifications] = useState<{ type: string; status: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPayConfirm, setShowPayConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        const supabase = createClient();

        // Fetch payments from DB
        const { data: paymentData } = await supabase
            .from("payments")
            .select("*")
            .eq("project_id", projectId)
            .order("percentage", { ascending: true });

        // Fetch certifications to check against payment requirements
        const { data: certData } = await supabase
            .from("certifications")
            .select("type, status")
            .eq("project_id", projectId);

        setPayments(paymentData || []);
        setCertifications(certData || []);
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Check if required certificates for a payment milestone are uploaded/verified
    const getCertStatus = (certsRequired: string[]) => {
        if (!certsRequired || certsRequired.length === 0) return { allMet: true, received: [], missing: [] };

        const received: string[] = [];
        const missing: string[] = [];

        for (const cert of certsRequired) {
            const normalizedCert = cert.toLowerCase().replace(/[^a-z]/g, "_");
            const found = certifications.find(c => {
                const normalizedType = c.type.toLowerCase().replace(/[^a-z]/g, "_");
                return normalizedType === normalizedCert &&
                    (c.status === "uploaded" || c.status === "verified");
            });
            if (found) {
                received.push(cert);
            } else {
                missing.push(cert);
            }
        }

        return { allMet: missing.length === 0, received, missing };
    };

    // Should I Pay? helper
    const shouldPayCheck = (payment: Payment) => {
        const certStatus = getCertStatus(payment.certificates_required);
        if (payment.status === "paid") return { safe: true, reason: "Already paid", color: "green" };
        if (!certStatus.allMet) return {
            safe: false,
            reason: `Missing ${certStatus.missing.length} certificate(s): ${certStatus.missing.join(", ")}`,
            color: "red"
        };
        return { safe: true, reason: "All certificates received — safe to pay", color: "green" };
    };

    // Mark a payment as paid
    const markAsPaid = async (paymentId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from("payments").update({
            status: "paid",
            paid_date: new Date().toISOString().split("T")[0],
            paid_amount: payments.find(p => p.id === paymentId)?.amount || 0,
        }).eq("id", paymentId);

        if (error) { alert("Failed to update payment. Please try again."); return; }
        setShowPayConfirm(null);
        fetchData();
    };

    // Calculate totals
    const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.paid_amount || p.amount), 0);
    const nextDue = payments.find(p => p.status !== "paid");
    const remainingBalance = contractValue - totalPaid;
    const paidPercent = contractValue > 0 ? Math.round((totalPaid / contractValue) * 100) : 0;

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading payment schedule...</div>;
    }

    if (payments.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">💰 Payment Schedule</h2>
                <div className="p-6 bg-card border border-border rounded-xl text-center">
                    <p className="text-muted-foreground mb-2">No payment milestones found.</p>
                    <p className="text-sm text-muted">Payment milestones are automatically created when you create a new project. For existing projects, they may need to be set up manually.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">💰 Payment Schedule</h2>
                <p className="text-muted-foreground">
                    Track progress payments linked to construction stages and certificates.
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
                    <div className="text-2xl font-bold text-green-800">{formatCurrency(totalPaid)}</div>
                    <div className="text-xs text-green-600">{paidPercent}% of contract</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="text-sm text-amber-700">Next Payment</div>
                    <div className="text-2xl font-bold text-amber-800">
                        {nextDue ? formatCurrency(nextDue.amount) : "—"}
                    </div>
                    <div className="text-xs text-amber-600">
                        {nextDue ? `${nextDue.stage_name} (${nextDue.percentage}%)` : "All paid"}
                    </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-700">Remaining Balance</div>
                    <div className="text-2xl font-bold text-blue-800">{formatCurrency(remainingBalance)}</div>
                </div>
            </div>

            {/* Should I Pay? Alert for next due */}
            {nextDue && (() => {
                const check = shouldPayCheck(nextDue);
                return (
                    <div className={`p-4 rounded-xl border ${check.safe
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                        }`}>
                        <h3 className={`font-bold mb-1 ${check.safe ? "text-green-800" : "text-red-800"}`}>
                            {check.safe ? "✅" : "🛑"} Should I Pay? — {nextDue.stage_name}
                        </h3>
                        <p className={`text-sm ${check.safe ? "text-green-700" : "text-red-700"}`}>
                            {check.reason}
                        </p>
                        {check.safe && nextDue.status !== "paid" && (
                            <button
                                onClick={() => setShowPayConfirm(nextDue.id)}
                                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                                Record Payment Made
                            </button>
                        )}
                        {!check.safe && (
                            <p className="mt-2 text-xs text-red-600 font-medium">
                                ⚠️ Do NOT pay until all required certificates are obtained. This is your legal right under Australian construction law.
                            </p>
                        )}
                    </div>
                );
            })()}

            {/* Payment Confirmation Modal */}
            {showPayConfirm && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2">Confirm Payment</h3>
                    <p className="text-sm text-amber-700 mb-3">
                        Are you sure you want to record this payment as made? This action can be reversed later.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => markAsPaid(showPayConfirm)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                            Yes, Payment Made
                        </button>
                        <button
                            onClick={() => setShowPayConfirm(null)}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/10"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Payment Progress</span>
                    <span>{paidPercent}%</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
                            className={`h-full transition-all ${payment.status === "paid"
                                ? "bg-green-500"
                                : payment.status === "blocked"
                                    ? "bg-red-400"
                                    : payment.id === nextDue?.id
                                        ? "bg-amber-500"
                                        : "bg-gray-300"
                                }`}
                            style={{ width: `${payment.percentage}%` }}
                            title={`${payment.stage_name}: ${payment.percentage}%`}
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
                            <th className="px-4 py-3 text-left text-sm font-medium">Safe to Pay?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => {
                            const check = shouldPayCheck(payment);
                            const certStatus = getCertStatus(payment.certificates_required);
                            return (
                                <tr
                                    key={payment.id}
                                    className={`border-t border-border ${payment.id === nextDue?.id ? "bg-amber-50" : ""}`}
                                >
                                    <td className="px-4 py-3 font-medium">{payment.stage_name}</td>
                                    <td className="px-4 py-3">{payment.percentage}%</td>
                                    <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${payment.status === "paid"
                                                ? "bg-green-100 text-green-700"
                                                : payment.status === "blocked"
                                                    ? "bg-red-100 text-red-700"
                                                    : payment.id === nextDue?.id
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {payment.status === "paid" ? "✓ Paid" : payment.status === "blocked" ? "🛑 Blocked" : payment.id === nextDue?.id ? "⏳ Due" : "Upcoming"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {(payment.certificates_required?.length || 0) > 0 ? (
                                            <div className="space-y-0.5">
                                                {payment.certificates_required.map((cert, idx) => (
                                                    <div key={idx} className="flex items-center gap-1">
                                                        {certStatus.received.includes(cert) ? (
                                                            <span className="text-green-600 text-xs">✓</span>
                                                        ) : (
                                                            <span className="text-red-600 text-xs">✗</span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{cert}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.status === "paid" ? (
                                            <span className="text-green-600 text-xs font-medium">✓</span>
                                        ) : (
                                            <span className={`text-xs font-medium ${check.safe ? "text-green-600" : "text-red-600"}`}>
                                                {check.safe ? "✅ Yes" : "🛑 No"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legal Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">📋 Your Payment Rights</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Deposit cannot exceed 10% of contract value (or $20,000, whichever is less)</li>
                    <li>• Progress payments must be linked to genuinely completed stages</li>
                    <li>• You can withhold payment until required certificates are provided</li>
                    <li>• Final payment (5%) should be held until Occupation Certificate is issued</li>
                    <li>• Never pay ahead of completed work — it is your strongest protection</li>
                </ul>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";
import SignatureCanvas from "react-signature-canvas";
import {
    calculateVariationTotal,
    calculateVariationPercent,
    calculateApprovedTotal,
    getVariationWarningLevel,
} from "@/lib/guardian/calculations";

interface Variation {
    id: string;
    title: string;
    description: string;
    additional_cost: number;
    labour_cost?: number;
    material_cost?: number;
    status: string;
    reason_category?: string;
    homeowner_signature_url?: string;
    builder_signature_url?: string;
    created_at: string;
}

export default function ProjectVariations({
    projectId,
    contractValue = 0,
}: {
    projectId: string;
    contractValue?: number;
}) {
    const [variations, setVariations] = useState<Variation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
    const signatureRef = useRef<SignatureCanvas>(null);

    const fetchVariations = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("variations")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching variations:", error);
        } else {
            setVariations(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVariations();
    }, [projectId]);

    // Calculate totals using tested utility functions
    const totalVariations = calculateVariationTotal(variations as any);
    const variationPercent = calculateVariationPercent(totalVariations, contractValue);
    const approvedTotal = calculateApprovedTotal(variations as any);
    const warningLevel = getVariationWarningLevel(variationPercent);

    const handleSign = async (variationId: string) => {
        if (!signatureRef.current) return;

        const signatureData = signatureRef.current.toDataURL("image/png");
        const supabase = createClient();

        // For now, store base64 directly (in prod, upload to storage)
        const { error } = await supabase
            .from("variations")
            .update({
                homeowner_signature_url: signatureData,
                status: "approved",
                signed_at: new Date().toISOString(),
            })
            .eq("id", variationId);

        if (!error) {
            setSelectedVariation(null);
            fetchVariations();
        }
    };

    if (loading) return <div className="text-sm text-muted">Loading variations...</div>;

    return (
        <div className="space-y-6">
            {warningLevel !== 'none' && (
                <div
                    className={`p-4 rounded-lg ${warningLevel === 'critical'
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-amber-500/10 border border-amber-500/30"
                        }`}
                >
                    <span className="text-2xl">{warningLevel === 'critical' ? "🚨" : "⚠️"}</span>
                    <div>
                        <h4 className="font-bold text-foreground">
                            {warningLevel === 'critical' ? "Critical Variation Alert" : "Variation Warning"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your variations have reached{" "}
                            <strong>{variationPercent.toFixed(1)}%</strong> of your original contract.
                            {variationPercent >= 15 && (
                                <span className="block mt-2">
                                    This exceeds the 15% threshold. Consider contacting NSW Fair Trading.
                                </span>
                            )}
                        </p>
                        {variationPercent >= 15 && (
                            <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                                📝 Generate Dispute Template
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Original Contract</div>
                    <div className="text-2xl font-bold">{formatMoney(contractValue)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Total Variations</div>
                    <div className={`text-2xl font-bold ${totalVariations > 0 ? "text-orange-500" : ""}`}>
                        +{formatMoney(totalVariations)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        ({variationPercent.toFixed(1)}% of contract)
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Projected Total</div>
                    <div className="text-2xl font-bold text-primary">
                        {formatMoney(contractValue + totalVariations)}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Variations Register</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    + Log New Variation
                </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left bg-card">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium">Description</th>
                            <th className="px-6 py-4 font-medium">Category</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Cost</th>
                            <th className="px-6 py-4 font-medium text-center">Signed</th>
                            <th className="px-6 py-4 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {variations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted">
                                    No variations recorded yet.
                                </td>
                            </tr>
                        ) : (
                            variations.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{item.title}</div>
                                        {item.description && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${item.reason_category === "builder_error"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {item.reason_category?.replace("_", " ") || "—"}
                                        </span>
                                        {item.reason_category === "builder_error" && (
                                            <div className="text-xs text-red-600 mt-1">
                                                ⚠️ Should be at builder's cost
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === "approved"
                                                ? "bg-green-500/10 text-green-600"
                                                : item.status === "rejected"
                                                    ? "bg-red-500/10 text-red-600"
                                                    : "bg-yellow-500/10 text-yellow-600"
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {formatMoney(item.additional_cost)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.homeowner_signature_url ? (
                                            <span className="text-green-600">✓ Signed</span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.status === "draft" || item.status === "sent" ? (
                                            <button
                                                onClick={() => setSelectedVariation(item)}
                                                className="text-sm px-3 py-1 bg-primary text-white rounded hover:opacity-90"
                                            >
                                                ✍️ Sign
                                            </button>
                                        ) : (
                                            <button className="text-sm text-primary hover:underline">View</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-muted/20 border-t border-border font-bold">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right">
                                Approved Extra Costs
                            </td>
                            <td className="px-6 py-4 text-right font-extrabold text-orange-600">
                                {formatMoney(approvedTotal)}
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Signature Modal */}
            {
                selectedVariation && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                            <h3 className="text-xl font-bold mb-2">Approve Variation</h3>
                            <p className="text-muted-foreground mb-4">
                                By signing below, you approve this variation and its associated cost.
                            </p>

                            <div className="bg-muted/20 rounded-lg p-4 mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted-foreground">Variation:</span>
                                    <span className="font-medium">{selectedVariation.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cost:</span>
                                    <span className="font-bold text-orange-600">
                                        {formatMoney(selectedVariation.additional_cost)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-border rounded-lg bg-white mb-4">
                                <SignatureCanvas
                                    ref={signatureRef}
                                    canvasProps={{
                                        className: "w-full h-32",
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Sign above using your mouse or finger.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => signatureRef.current?.clear()}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/10"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => setSelectedVariation(null)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSign(selectedVariation.id)}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    ✓ Approve & Sign
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

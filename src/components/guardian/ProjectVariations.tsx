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
    type Variation as CalcVariation,
} from "@/lib/guardian/calculations";
import type { Variation } from "@/types/guardian";

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
    const calcVariations: CalcVariation[] = variations.map(v => ({
        id: v.id,
        title: v.title,
        additional_cost: v.additional_cost,
        status: v.status,
        reason_category: v.reason_category,
    }));
    const totalVariations = calculateVariationTotal(calcVariations);
    const variationPercent = calculateVariationPercent(totalVariations, contractValue);
    const approvedTotal = calculateApprovedTotal(calcVariations);
    const warningLevel = getVariationWarningLevel(variationPercent);

    const handleSign = async (variationId: string) => {
        if (!signatureRef.current) return;

        const signatureData = signatureRef.current.toDataURL("image/png");
        const supabase = createClient();

        // Upload signature as image to Supabase Storage instead of storing base64 in DB
        let signatureUrl = signatureData; // Fallback to base64 if upload fails
        try {
            const base64Data = signatureData.split(",")[1];
            const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: "image/png" });
            const fileName = `signatures/${projectId}/${variationId}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(fileName, blob, { contentType: "image/png" });

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from("documents")
                    .getPublicUrl(fileName);
                signatureUrl = urlData.publicUrl;
            }
        } catch {
            // If storage upload fails, fall back to base64 in DB
            console.warn("Signature upload to storage failed, using base64 fallback");
        }

        const { error } = await supabase
            .from("variations")
            .update({
                homeowner_signature_url: signatureUrl,
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
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    {showAddForm ? "Cancel" : "+ Log New Variation"}
                </button>
            </div>

            {/* Add Variation Form */}
            {showAddForm && (
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const supabase = createClient();

                        const { error } = await supabase.from("variations").insert({
                            project_id: projectId,
                            title: formData.get("title") as string,
                            description: formData.get("description") as string,
                            additional_cost: parseFloat(formData.get("additional_cost") as string) || 0,
                            labour_cost: parseFloat(formData.get("labour_cost") as string) || 0,
                            material_cost: parseFloat(formData.get("material_cost") as string) || 0,
                            reason_category: formData.get("reason_category") as string || null,
                            status: "draft",
                        });

                        if (!error) {
                            setShowAddForm(false);
                            fetchVariations();
                        } else {
                            alert("Failed to add variation. Please try again.");
                        }
                    }}
                    className="p-6 bg-card border border-border rounded-xl space-y-4"
                >
                    <h3 className="font-bold">Log New Variation</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                name="title"
                                type="text"
                                required
                                placeholder="e.g., Upgraded kitchen benchtop"
                                className="w-full p-3 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                placeholder="Describe the variation in detail..."
                                className="w-full p-3 border border-border rounded-lg bg-background resize-none h-20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Additional Cost ($) *</label>
                            <input
                                name="additional_cost"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                className="w-full p-3 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Reason Category</label>
                            <select
                                name="reason_category"
                                className="w-full p-3 border border-border rounded-lg bg-background"
                            >
                                <option value="">Select category...</option>
                                <option value="design_change">Design Change</option>
                                <option value="site_condition">Site Condition</option>
                                <option value="regulatory">Regulatory Requirement</option>
                                <option value="builder_error">Builder Error</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Labour Cost ($)</label>
                            <input
                                name="labour_cost"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full p-3 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Material Cost ($)</label>
                            <input
                                name="material_cost"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full p-3 border border-border rounded-lg bg-background"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Add Variation
                    </button>
                </form>
            )}

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

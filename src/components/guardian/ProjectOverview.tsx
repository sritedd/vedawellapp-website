"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";
import type { Project } from "@/types/guardian";

interface ProjectOverviewProps {
    project: Project;
    variationsTotal?: number;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
    const [variationsTotal, setVariationsTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVariationsTotal = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("variations")
                .select("additional_cost")
                .eq("project_id", project.id)
                .eq("status", "approved");

            if (!error && data) {
                const total = data.reduce((sum: number, v: { additional_cost: number | null }) => sum + (v.additional_cost || 0), 0);
                setVariationsTotal(total);
            }
            setLoading(false);
        };

        fetchVariationsTotal();
    }, [project.id]);

    const contractValue = project.contract_value || 0;
    const totalCost = contractValue + variationsTotal;
    const variationPercent = contractValue > 0 ? (variationsTotal / contractValue) * 100 : 0;

    // Check license/insurance expiry
    const insuranceExpiry = project.insurance_expiry_date
        ? new Date(project.insurance_expiry_date)
        : null;
    const today = new Date();
    const daysUntilExpiry = insuranceExpiry
        ? Math.ceil((insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="space-y-8">
            {/* License/Insurance Alert */}
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                <div
                    className={`p-4 rounded-lg flex items-start gap-3 ${daysUntilExpiry <= 0
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-amber-500/10 border border-amber-500/30"
                        }`}
                >
                    <span className="text-2xl">{daysUntilExpiry <= 0 ? "🚨" : "⚠️"}</span>
                    <div>
                        <h4 className="font-bold">
                            {daysUntilExpiry <= 0 ? "Builder Insurance EXPIRED" : "Insurance Expiring Soon"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {daysUntilExpiry <= 0
                                ? "Your builder's HBCF insurance has expired. You should NOT make any further payments until this is resolved."
                                : `Insurance expires in ${daysUntilExpiry} days. Request an updated certificate from your builder.`}
                        </p>
                        <button className="mt-2 text-sm text-primary hover:underline">
                            📄 View Certificate
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Contract Value</div>
                    <div className="text-2xl font-bold">{formatMoney(contractValue)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Approved Variations</div>
                    <div
                        className={`text-2xl font-bold ${variationsTotal > 0 ? "text-orange-500" : ""
                            }`}
                    >
                        {variationsTotal > 0 ? "+" : ""}
                        {formatMoney(variationsTotal)}
                    </div>
                    {variationPercent > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                            ({variationPercent.toFixed(1)}% of contract)
                        </div>
                    )}
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Projected Total</div>
                    <div className="text-2xl font-bold text-primary">
                        {formatMoney(totalCost)}
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Builder License</div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-3 h-3 rounded-full ${project.builder_license_number
                                    ? daysUntilExpiry && daysUntilExpiry <= 0
                                        ? "bg-red-500"
                                        : daysUntilExpiry && daysUntilExpiry <= 30
                                            ? "bg-amber-500"
                                            : "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                        />
                        <span className="text-sm font-medium">
                            {project.builder_license_number
                                ? daysUntilExpiry && daysUntilExpiry <= 0
                                    ? "Check Required"
                                    : "Active"
                                : "Not Set"}
                        </span>
                    </div>
                    {project.builder_license_number && (
                        <a
                            href={`https://www.onegov.nsw.gov.au/publicregister/#/search/trades`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 block"
                        >
                            Verify on Fair Trading →
                        </a>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Progress Tracker */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Construction Progress</h3>
                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {[
                            { id: "1", name: "Site Start", completed: true },
                            { id: "2", name: "Slab Down", completed: true },
                            { id: "3", name: "Frame Stage", completed: false, current: true },
                            { id: "4", name: "Lockup / Enclosed", completed: false },
                            { id: "5", name: "Fixing", completed: false },
                            { id: "6", name: "Practical Completion", completed: false },
                        ].map((stage) => (
                            <div key={stage.id} className="relative flex items-start gap-4 pl-0">
                                <div
                                    className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background ${stage.completed
                                            ? "border-green-500 bg-green-500"
                                            : stage.current
                                                ? "border-primary"
                                                : "border-border"
                                        }`}
                                >
                                    {stage.completed && <span className="text-white text-xs">✓</span>}
                                    {stage.current && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                    )}
                                </div>
                                <div>
                                    <h4
                                        className={`font-medium ${stage.completed || stage.current
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {stage.name}
                                    </h4>
                                    {stage.current && (
                                        <p className="text-xs text-primary mt-1">Current Stage • In Progress</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Builder Details */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Builder Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">Builder Name</span>
                            <span className="font-medium">{project.builder_name || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">License #</span>
                            <span className="font-medium font-mono">
                                {project.builder_license_number || "Not set"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">ABN</span>
                            <span className="font-medium font-mono">
                                {project.builder_abn || "Not set"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">HBCF Policy #</span>
                            <span className="font-medium font-mono">
                                {project.hbcf_policy_number || "Not set"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">Insurance Expiry</span>
                            <span
                                className={`font-medium ${daysUntilExpiry !== null && daysUntilExpiry <= 0
                                        ? "text-red-600"
                                        : daysUntilExpiry !== null && daysUntilExpiry <= 30
                                            ? "text-amber-600"
                                            : ""
                                    }`}
                            >
                                {project.insurance_expiry_date
                                    ? new Date(project.insurance_expiry_date).toLocaleDateString()
                                    : "Not set"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">Start Date</span>
                            <span className="font-medium">
                                {project.start_date
                                    ? new Date(project.start_date).toLocaleDateString()
                                    : "TBD"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-muted text-sm">Site Address</span>
                            <span className="font-medium text-right max-w-[200px]">
                                {project.address || "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";
import type { Project } from "@/types/guardian";
import {
    getInsuranceAlerts,
    getStateInsuranceConfig,
    getCoolingOffStatus,
    getWarrantyAlerts,
    getLicenseVerificationUrl,
    getLicenseVerificationLabel,
    type InsuranceAlert,
    type CoolingOffStatus,
    type WarrantyAlert,
} from "@/lib/guardian/calculations";

interface ProjectOverviewProps {
    project: Project;
    variationsTotal?: number;
}

interface StageRow {
    id: string;
    name: string;
    status: string;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
    const [variationsTotal, setVariationsTotal] = useState(0);
    const [stages, setStages] = useState<StageRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            const { data: varData, error: varError } = await supabase
                .from("variations")
                .select("additional_cost")
                .eq("project_id", project.id)
                .eq("status", "approved");

            if (!varError && varData) {
                const total = varData.reduce((sum: number, v: { additional_cost: number | null }) => sum + (v.additional_cost || 0), 0);
                setVariationsTotal(total);
            }

            const { data: stageData } = await supabase
                .from("stages")
                .select("id, name, status")
                .eq("project_id", project.id)
                .order("order_index", { ascending: true });

            if (stageData && stageData.length > 0) {
                setStages(stageData);
            }

            setLoading(false);
        };

        fetchData();
    }, [project.id]);

    const contractValue = project.contract_value || 0;
    const totalCost = contractValue + variationsTotal;
    const variationPercent = contractValue > 0 ? (variationsTotal / contractValue) * 100 : 0;
    const stateCode = project.state || "NSW";

    // Insurance validation
    const insuranceAlerts: InsuranceAlert[] = getInsuranceAlerts(
        contractValue,
        stateCode,
        project.hbcf_policy_number,
        project.insurance_expiry_date,
    );
    const insuranceConfig = getStateInsuranceConfig(stateCode);

    // Cooling-off period
    const coolingOff: CoolingOffStatus | null = project.contract_signed_date
        ? getCoolingOffStatus(project.contract_signed_date, stateCode)
        : null;

    // Warranty proactive alerts
    const warrantyAlerts: WarrantyAlert[] = project.handover_date
        ? getWarrantyAlerts(project.handover_date, stateCode)
        : [];

    // License verification URL
    const licenseUrl = getLicenseVerificationUrl(stateCode);
    const licenseLabel = getLicenseVerificationLabel(stateCode);

    // Insurance expiry for builder details section
    const daysUntilExpiry = project.insurance_expiry_date
        ? Math.ceil((new Date(project.insurance_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="space-y-8">
            {/* Cooling-Off Countdown */}
            {coolingOff?.isActive && (
                <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⏱️</span>
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-700 dark:text-blue-400">
                                Cooling-Off Period Active — {coolingOff.daysRemaining} day{coolingOff.daysRemaining !== 1 ? 's' : ''} remaining
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                You can cancel this contract without penalty until{' '}
                                <strong>{coolingOff.endDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                {' '}{coolingOff.stateNote}.
                            </p>
                            <div className="mt-3 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.max(5, (coolingOff.daysRemaining / coolingOff.totalDays) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {coolingOff.totalDays} business day cooling-off period ({stateCode})
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Insurance Validation Alerts */}
            {insuranceAlerts.map((alert, idx) => (
                <div
                    key={`ins-${idx}`}
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                        alert.level === 'critical'
                            ? "bg-red-500/10 border border-red-500/30"
                            : alert.level === 'warning'
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : "bg-blue-500/10 border border-blue-500/30"
                    }`}
                >
                    <span className="text-2xl">
                        {alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>
                        <h4 className="font-bold">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        {insuranceConfig && (
                            <a
                                href={insuranceConfig.verifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-sm text-primary hover:underline inline-block"
                            >
                                Check {insuranceConfig.scheme} status →
                            </a>
                        )}
                    </div>
                </div>
            ))}

            {/* Warranty Proactive Alerts */}
            {warrantyAlerts.map((alert, idx) => (
                <div
                    key={`war-${idx}`}
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                        alert.level === 'critical'
                            ? "bg-red-500/10 border border-red-500/30"
                            : alert.level === 'warning'
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : "bg-blue-500/10 border border-blue-500/30"
                    }`}
                >
                    <span className="text-2xl">
                        {alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⏰' : '📋'}
                    </span>
                    <div>
                        <h4 className="font-bold">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {alert.daysLeft > 0
                                ? `Expires: ${alert.expiryDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                : `Expired: ${alert.expiryDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            }
                        </p>
                    </div>
                </div>
            ))}

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Contract Value</div>
                    <div className="text-2xl font-bold">{formatMoney(contractValue)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Approved Variations</div>
                    <div
                        className={`text-2xl font-bold ${variationsTotal > 0 ? "text-amber-500" : ""}`}
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
                                    ? daysUntilExpiry !== null && daysUntilExpiry <= 0
                                        ? "bg-red-500"
                                        : daysUntilExpiry !== null && daysUntilExpiry <= 30
                                            ? "bg-amber-500"
                                            : "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                        />
                        <span className="text-sm font-medium">
                            {project.builder_license_number
                                ? daysUntilExpiry !== null && daysUntilExpiry <= 0
                                    ? "Check Required"
                                    : "Active"
                                : "Not Set"}
                        </span>
                    </div>
                    {project.builder_license_number && (
                        <a
                            href={licenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 block"
                        >
                            {licenseLabel} →
                        </a>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Progress Tracker */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Construction Progress</h3>
                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {stages.length === 0 ? (
                            <p className="text-muted-foreground text-sm pl-10">No stages configured for this project.</p>
                        ) : stages.map((stage, idx) => {
                            const isCompleted = stage.status === "completed" || stage.status === "verified";
                            const isCurrent = stage.status === "in_progress";
                            const isPending = stage.status === "pending";
                            const isFirstPending = isPending && !stages.some(s => s.status === "in_progress") && stages.findIndex(s => s.status === "pending") === idx;

                            return (
                            <div key={stage.id} className="relative flex items-start gap-4 pl-0">
                                <div
                                    className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background ${isCompleted
                                            ? "border-green-500 bg-green-500"
                                            : (isCurrent || isFirstPending)
                                                ? "border-primary"
                                                : "border-border"
                                        }`}
                                >
                                    {isCompleted && <span className="text-white text-xs">✓</span>}
                                    {(isCurrent || isFirstPending) && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                    )}
                                </div>
                                <div>
                                    <h4
                                        className={`font-medium ${isCompleted || isCurrent || isFirstPending
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {stage.name}
                                    </h4>
                                    {(isCurrent || isFirstPending) && (
                                        <p className="text-xs text-primary mt-1">Current Stage - {isCurrent ? "In Progress" : "Up Next"}</p>
                                    )}
                                </div>
                            </div>
                            );
                        })}
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
                            <span className="text-muted text-sm">{insuranceConfig?.label || 'Insurance Policy #'}</span>
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
                        {project.contract_signed_date && (
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted text-sm">Contract Signed</span>
                                <span className="font-medium">
                                    {new Date(project.contract_signed_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted text-sm">Start Date</span>
                            <span className="font-medium">
                                {project.start_date
                                    ? new Date(project.start_date).toLocaleDateString()
                                    : "TBD"}
                            </span>
                        </div>
                        {project.handover_date && (
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted text-sm">Handover Date</span>
                                <span className="font-medium">
                                    {new Date(project.handover_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
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

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    generateProjectSummaryPDF,
    generateDefectListPDF,
    generateVariationReportPDF,
    generatePaymentSchedulePDF,
    generateDisputePackagePDF,
    downloadAsTextFile,
    printContent,
    type PDFReportData,
    type DefectReportItem,
    type VariationReportItem,
    type PaymentMilestone,
} from "@/lib/export/pdf-export";

interface ExportCenterProps {
    projectId: string;
    projectName: string;
    builderName: string;
    contractValue: number;
}

interface ExportOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: "report" | "document" | "legal";
}

type ExportFormat = "pdf" | "html" | "txt";

const FORMAT_OPTIONS: { id: ExportFormat; name: string; icon: string; description: string }[] = [
    { id: "pdf", name: "PDF", icon: "📄", description: "Best for printing & sharing" },
    { id: "html", name: "HTML", icon: "🌐", description: "Open in browser" },
    { id: "txt", name: "Text", icon: "📝", description: "Plain text format" },
];

const EXPORT_OPTIONS: ExportOption[] = [
    { id: "project-summary", name: "Project Summary", description: "Overview of project progress, key metrics, and status", icon: "📊", category: "report" },
    { id: "defect-list", name: "Defect Report", description: "Complete list of all defects with status and details", icon: "🛠️", category: "report" },
    { id: "variation-report", name: "Variation Report", description: "All variations with costs and approval status", icon: "💰", category: "report" },
    { id: "payment-schedule", name: "Payment Schedule", description: "Payment milestones and progress payment summary", icon: "💳", category: "document" },
    { id: "dispute-package", name: "Fair Trading Dispute Package", description: "Pre-formatted dispute documentation for NSW Fair Trading", icon: "⚖️", category: "legal" },
];

// Standard NSW residential build payment schedule percentages
const STAGE_PAYMENT_SCHEDULE = [
    { stage: "Deposit", percentage: 5 },
    { stage: "Base/Slab", percentage: 15 },
    { stage: "Frame", percentage: 20 },
    { stage: "Lockup", percentage: 25 },
    { stage: "Fixing", percentage: 20 },
    { stage: "Completion", percentage: 15 },
];

export default function ExportCenter({ projectId, projectName, builderName, contractValue }: ExportCenterProps) {
    const [selectedExport, setSelectedExport] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
    const [loading, setLoading] = useState(false);

    // Real data from DB
    const [defects, setDefects] = useState<DefectReportItem[]>([]);
    const [variations, setVariations] = useState<VariationReportItem[]>([]);
    const [payments, setPayments] = useState<PaymentMilestone[]>([]);
    const [stages, setStages] = useState<{ name: string; status: string }[]>([]);
    const [commsLog, setCommsLog] = useState<{ date: string; event: string }[]>([]);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        const supabase = createClient();

        // Fetch defects
        const { data: defectsData } = await supabase
            .from("defects")
            .select("title, location, severity, status, reported_date, description, created_at")
            .eq("project_id", projectId);

        if (defectsData) {
            setDefects(defectsData.map((d: Record<string, unknown>) => ({
                title: (d.title as string) || "",
                location: (d.location as string) || "",
                severity: (d.severity as string) || "minor",
                status: (d.status as string) || "open",
                reportedDate: (d.reported_date as string) || (d.created_at as string)?.split("T")[0] || "",
                description: (d.description as string) || "",
            })));
        }

        // Fetch variations
        const { data: varsData } = await supabase
            .from("variations")
            .select("title, description, additional_cost, status, created_at")
            .eq("project_id", projectId);

        if (varsData) {
            setVariations(varsData.map((v: Record<string, unknown>) => ({
                title: (v.title as string) || "",
                description: (v.description as string) || "",
                amount: (v.additional_cost as number) || 0,
                status: (v.status as string) || "draft",
                date: (v.created_at as string)?.split("T")[0] || "",
            })));
        }

        // Fetch stages to compute payment milestones
        const { data: stagesData } = await supabase
            .from("stages")
            .select("name, status")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (stagesData) {
            setStages(stagesData as { name: string; status: string }[]);

            // Build payment milestones from stages + standard percentages
            const paymentList: PaymentMilestone[] = STAGE_PAYMENT_SCHEDULE.map((sp) => {
                const matchingStage = stagesData.find((s: { name: string; status: string }) =>
                    s.name.toLowerCase().includes(sp.stage.toLowerCase().replace("/", ""))
                );
                return {
                    stage: sp.stage,
                    percentage: sp.percentage,
                    amount: Math.round(contractValue * sp.percentage / 100),
                    status: matchingStage?.status === "completed" ? "paid" : "pending",
                    dueDate: "",
                };
            });
            setPayments(paymentList);
        }

        // Fetch communication log for dispute package timeline
        const { data: commsData } = await supabase
            .from("communication_log")
            .select("date, summary")
            .eq("project_id", projectId)
            .order("date", { ascending: true });

        if (commsData) {
            setCommsLog(commsData.map((c: Record<string, unknown>) => ({
                date: (c.date as string) || "",
                event: (c.summary as string) || "",
            })));
        }
    };

    const baseReportData: PDFReportData = {
        projectName,
        builderName,
        contractValue,
        generatedDate: new Date().toISOString(),
    };

    const generatePreview = (exportId: string) => {
        let content = "";
        const openDefects = defects.filter(d => d.status !== "verified" && d.status !== "rectified").length;
        const pendingVariations = variations.filter(v => v.status === "draft" || v.status === "sent").length;
        const totalVariationValue = variations.reduce((sum, v) => sum + v.amount, 0);

        // Figure out current stage
        const activeStage = stages.find(s => s.status !== "completed");
        const completedStages = stages.filter(s => s.status === "completed").length;
        const progress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

        switch (exportId) {
            case "project-summary":
                content = generateProjectSummaryPDF({
                    ...baseReportData,
                    address: "",
                    currentStage: activeStage?.name || "Not started",
                    progress,
                    openDefects,
                    pendingVariations,
                    totalVariationValue,
                });
                break;
            case "defect-list":
                content = generateDefectListPDF(baseReportData, defects);
                break;
            case "variation-report":
                content = generateVariationReportPDF(baseReportData, variations);
                break;
            case "payment-schedule":
                content = generatePaymentSchedulePDF(baseReportData, payments);
                break;
            case "dispute-package":
                content = generateDisputePackagePDF(
                    baseReportData,
                    defects,
                    variations,
                    commsLog.length > 0 ? commsLog : [{ date: new Date().toISOString().split("T")[0], event: "No communication log entries recorded" }]
                );
                break;
        }

        setPreviewContent(content);
        setSelectedExport(exportId);
        setShowPreview(true);
    };

    const handleDownload = () => {
        if (!selectedExport || !previewContent) return;
        const baseName = `${projectName.replace(/\s+/g, "_")}_${selectedExport}_${new Date().toISOString().split("T")[0]}`;
        const option = EXPORT_OPTIONS.find(o => o.id === selectedExport);
        const title = option?.name || "Report";

        switch (selectedFormat) {
            case "pdf":
                printContent(previewContent, title);
                break;
            case "html":
                downloadAsHTML(previewContent, `${baseName}.html`, title);
                break;
            case "txt":
                downloadAsTextFile(previewContent, `${baseName}.txt`);
                break;
        }
    };

    const downloadAsHTML = (content: string, filename: string, title: string) => {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Courier New', monospace; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
        pre { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); white-space: pre-wrap; word-wrap: break-word; }
        @media print { body { margin: 0; padding: 20px; background: white; } pre { box-shadow: none; } }
    </style>
</head>
<body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        if (!previewContent) return;
        const option = EXPORT_OPTIONS.find(o => o.id === selectedExport);
        printContent(previewContent, option?.name || "Report");
    };

    const handleCopy = async () => {
        if (!previewContent) return;
        await navigator.clipboard.writeText(previewContent);
    };

    const groupedOptions = {
        report: EXPORT_OPTIONS.filter(o => o.category === "report"),
        document: EXPORT_OPTIONS.filter(o => o.category === "document"),
        legal: EXPORT_OPTIONS.filter(o => o.category === "legal"),
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Export Center</h2>
                <p className="text-muted-foreground">
                    Generate professional reports and documents from your real project data
                </p>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-3">Reports</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.report.map((option) => (
                            <button key={option.id} onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                                <div className="text-3xl mb-2">{option.icon}</div>
                                <h4 className="font-bold">{option.name}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-3">Documents</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.document.map((option) => (
                            <button key={option.id} onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                                <div className="text-3xl mb-2">{option.icon}</div>
                                <h4 className="font-bold">{option.name}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-3">Legal & Disputes</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.legal.map((option) => (
                            <button key={option.id} onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id ? "border-red-500 bg-red-50" : "border-red-200 hover:border-red-400"}`}>
                                <div className="text-3xl mb-2">{option.icon}</div>
                                <h4 className="font-bold">{option.name}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {EXPORT_OPTIONS.find(o => o.id === selectedExport)?.name} Preview
                            </h3>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-muted rounded-lg text-gray-700 dark:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="font-mono text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg">
                                {previewContent}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-border">
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Download Format:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {FORMAT_OPTIONS.map((format) => (
                                        <button key={format.id} onClick={() => setSelectedFormat(format.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${selectedFormat === format.id
                                                ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                                            <span>{format.icon}</span><span>{format.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.description}
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={handleCopy} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                    Copy
                                </button>
                                <button onClick={handlePrint} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                    Print
                                </button>
                                <button onClick={handleDownload} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                                    Download as {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pro PDF Export */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm">Download Professional PDF Report</h3>
                        <p className="text-xs text-muted mt-1">
                            Full defect &amp; variation report as a properly formatted PDF document.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await fetch(`/api/guardian/export-pdf?projectId=${projectId}`);
                                if (res.status === 403) {
                                    alert("PDF export requires Guardian Pro. Upgrade at /guardian/pricing");
                                    return;
                                }
                                if (!res.ok) throw new Error("Export failed");
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `guardian-report-${projectName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                            } catch {
                                alert("Failed to generate PDF. Please try again.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 shrink-0"
                    >
                        {loading ? "Generating..." : "Download PDF"}
                    </button>
                </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">Export Tips</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Reports use your real project data from the database</li>
                    <li>Keep copies of all reports for your records</li>
                    <li>The Dispute Package includes NSW Fair Trading contact details</li>
                    <li>Regular exports help maintain a paper trail for accountability</li>
                </ul>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
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
    {
        id: "project-summary",
        name: "Project Summary",
        description: "Overview of project progress, key metrics, and status",
        icon: "📊",
        category: "report",
    },
    {
        id: "defect-list",
        name: "Defect Report",
        description: "Complete list of all defects with status and details",
        icon: "🛠️",
        category: "report",
    },
    {
        id: "variation-report",
        name: "Variation Report",
        description: "All variations with costs and approval status",
        icon: "💰",
        category: "report",
    },
    {
        id: "payment-schedule",
        name: "Payment Schedule",
        description: "Payment milestones and progress payment summary",
        icon: "💳",
        category: "document",
    },
    {
        id: "dispute-package",
        name: "Fair Trading Dispute Package",
        description: "Pre-formatted dispute documentation for NSW Fair Trading",
        icon: "⚖️",
        category: "legal",
    },
];

// Sample data for exports
const SAMPLE_DEFECTS: DefectReportItem[] = [
    {
        title: "Cracked tile in Master Ensuite",
        location: "Master Ensuite",
        severity: "minor",
        status: "reported",
        reportedDate: "2025-08-01",
        description: "Hairline crack visible on floor tile near shower entry",
    },
    {
        title: "Paint peeling on garage ceiling",
        location: "Garage",
        severity: "cosmetic",
        status: "open",
        reportedDate: "2025-08-05",
        description: "Paint bubbling and peeling in two areas, approximately 30cm x 30cm each",
    },
    {
        title: "Door not closing properly - Bedroom 2",
        location: "Bedroom 2",
        severity: "major",
        status: "in_progress",
        reportedDate: "2025-07-28",
        description: "Door rubs against frame, requires excessive force to close",
    },
];

const SAMPLE_VARIATIONS: VariationReportItem[] = [
    {
        title: "Upgrade to engineered timber flooring",
        description: "Change from carpet to engineered timber in living areas",
        amount: 8500,
        status: "approved",
        date: "2025-06-15",
    },
    {
        title: "Additional power points in garage",
        description: "Add 4 additional double power points for workshop",
        amount: 1200,
        status: "approved",
        date: "2025-07-01",
    },
    {
        title: "Upgrade to stone benchtops",
        description: "Change from laminate to 40mm Caesarstone in kitchen",
        amount: 4500,
        status: "pending",
        date: "2025-07-20",
    },
];

const SAMPLE_PAYMENTS: PaymentMilestone[] = [
    { stage: "Deposit", percentage: 5, amount: 25000, status: "paid", dueDate: "2025-03-01" },
    { stage: "Base/Slab", percentage: 15, amount: 75000, status: "paid", dueDate: "2025-05-15" },
    { stage: "Frame", percentage: 20, amount: 100000, status: "paid", dueDate: "2025-06-20" },
    { stage: "Lockup", percentage: 25, amount: 125000, status: "due", dueDate: "2025-08-20" },
    { stage: "Fixing", percentage: 20, amount: 100000, status: "pending", dueDate: "2025-09-30" },
    { stage: "Completion", percentage: 15, amount: 75000, status: "pending", dueDate: "2025-10-30" },
];

export default function ExportCenter({ projectId, projectName, builderName, contractValue }: ExportCenterProps) {
    const [selectedExport, setSelectedExport] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");

    const baseReportData: PDFReportData = {
        projectName,
        builderName,
        contractValue,
        generatedDate: new Date().toISOString(),
    };

    const generatePreview = (exportId: string) => {
        let content = "";

        switch (exportId) {
            case "project-summary":
                content = generateProjectSummaryPDF({
                    ...baseReportData,
                    address: "123 New Build Street, Sydney NSW 2000",
                    currentStage: "Lockup",
                    progress: 65,
                    openDefects: 3,
                    pendingVariations: 1,
                    totalVariationValue: 14200,
                });
                break;
            case "defect-list":
                content = generateDefectListPDF(baseReportData, SAMPLE_DEFECTS);
                break;
            case "variation-report":
                content = generateVariationReportPDF(baseReportData, SAMPLE_VARIATIONS);
                break;
            case "payment-schedule":
                content = generatePaymentSchedulePDF(baseReportData, SAMPLE_PAYMENTS);
                break;
            case "dispute-package":
                content = generateDisputePackagePDF(
                    baseReportData,
                    SAMPLE_DEFECTS,
                    SAMPLE_VARIATIONS,
                    [
                        { date: "2025-07-28", event: "Defect reported in writing" },
                        { date: "2025-08-01", event: "First reminder sent" },
                        { date: "2025-08-05", event: "Second reminder sent" },
                    ]
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
                // Open print dialog - user can save as PDF
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
        body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        pre {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        @media print {
            body { margin: 0; padding: 20px; background: white; }
            pre { box-shadow: none; }
        }
    </style>
</head>
<body>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
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
        alert("Report copied to clipboard!");
    };

    const groupedOptions = {
        report: EXPORT_OPTIONS.filter(o => o.category === "report"),
        document: EXPORT_OPTIONS.filter(o => o.category === "document"),
        legal: EXPORT_OPTIONS.filter(o => o.category === "legal"),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">📄 Export Center</h2>
                <p className="text-muted-foreground">
                    Generate professional reports and documents for your project
                </p>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
                {/* Reports */}
                <div>
                    <h3 className="font-bold text-lg mb-3">📊 Reports</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.report.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="text-3xl mb-2">{option.icon}</div>
                                <h4 className="font-bold">{option.name}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents */}
                <div>
                    <h3 className="font-bold text-lg mb-3">📁 Documents</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.document.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="text-3xl mb-2">{option.icon}</div>
                                <h4 className="font-bold">{option.name}</h4>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legal */}
                <div>
                    <h3 className="font-bold text-lg mb-3">⚖️ Legal & Disputes</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {groupedOptions.legal.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => generatePreview(option.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedExport === option.id
                                    ? "border-red-500 bg-red-50"
                                    : "border-red-200 hover:border-red-400"
                                    }`}
                            >
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
                        {/* Modal Header */}
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {EXPORT_OPTIONS.find(o => o.id === selectedExport)?.name} Preview
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-muted rounded-lg text-gray-700 dark:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="font-mono text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg">
                                {previewContent}
                            </pre>
                        </div>

                        {/* Format Selector & Actions */}
                        <div className="p-4 border-t border-border">
                            {/* Format Selector */}
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📁 Select Download Format:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {FORMAT_OPTIONS.map((format) => (
                                        <button
                                            key={format.id}
                                            onClick={() => setSelectedFormat(format.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${selectedFormat === format.id
                                                    ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                        >
                                            <span>{format.icon}</span>
                                            <span>{format.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.description}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    📋 Copy
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    🖨️ Print
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                                >
                                    📥 Download as {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">📄 Export Tips</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Reports are formatted for easy printing on A4 paper</li>
                    <li>Keep copies of all reports for your records</li>
                    <li>The Dispute Package includes NSW Fair Trading contact details</li>
                    <li>Regular exports help maintain a paper trail for accountability</li>
                </ul>
            </div>
        </div>
    );
}

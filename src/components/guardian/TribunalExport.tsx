"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downloadAsTextFile, printContent } from "@/lib/export/pdf-export";

interface TribunalExportProps {
    projectId: string;
    projectName: string;
    builderName: string;
    contractValue: number;
    address: string;
    stateCode?: string;
}

// State-specific tribunal contact info
const TRIBUNAL_INFO: Record<string, { name: string; phone: string; fairTrading: string; ftPhone: string; insurance: string; insPhone: string }> = {
    NSW: { name: "NCAT (NSW Civil & Administrative Tribunal)", phone: "1300 006 228", fairTrading: "NSW Fair Trading", ftPhone: "13 32 20", insurance: "HBCF Claims", insPhone: "1800 110 877" },
    VIC: { name: "VCAT (Victorian Civil & Administrative Tribunal)", phone: "1300 018 228", fairTrading: "Consumer Affairs Victoria", ftPhone: "1300 558 181", insurance: "VMIA Domestic Building", insPhone: "1800 623 694" },
    QLD: { name: "QCAT (Queensland Civil & Administrative Tribunal)", phone: "1300 753 228", fairTrading: "Office of Fair Trading QLD", ftPhone: "13 74 68", insurance: "QBCC Insurance", insPhone: "139 333" },
    WA: { name: "SAT (State Administrative Tribunal)", phone: "1300 306 017", fairTrading: "Consumer Protection WA", ftPhone: "1300 304 054", insurance: "Building Commission WA", insPhone: "1300 489 099" },
    SA: { name: "SACAT (SA Civil & Administrative Tribunal)", phone: "1800 723 767", fairTrading: "Consumer & Business Services SA", ftPhone: "131 882", insurance: "SA Building Insurance", insPhone: "131 882" },
    TAS: { name: "Magistrates Court (Civil Division)", phone: "1300 664 608", fairTrading: "Consumer Affairs Tasmania", ftPhone: "1300 654 499", insurance: "TAS Building Insurance", insPhone: "1300 654 499" },
    ACT: { name: "ACAT (ACT Civil & Administrative Tribunal)", phone: "(02) 6207 1740", fairTrading: "Access Canberra", ftPhone: "13 22 81", insurance: "ACT Building Insurance", insPhone: "13 22 81" },
    NT: { name: "NT Civil & Administrative Tribunal", phone: "1800 019 319", fairTrading: "NT Consumer Affairs", ftPhone: "1800 019 319", insurance: "NT Building Insurance", insPhone: "1800 019 319" },
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(d: string): string {
    if (!d) return "Unknown date";
    try { return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
}

export default function TribunalExport({ projectId, projectName, builderName, contractValue, address, stateCode = "NSW" }: TribunalExportProps) {
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [lastContent, setLastContent] = useState("");

    const tribunal = TRIBUNAL_INFO[stateCode] || TRIBUNAL_INFO.NSW;

    const generate = async () => {
        setGenerating(true);

        const supabase = createClient();

        // Fetch all evidence in parallel
        const [defectsRes, variationsRes, commsRes, certsRes, inspRes, paymentsRes, photosRes] = await Promise.all([
            supabase.from("defects").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
            supabase.from("variations").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
            supabase.from("communication_log").select("*").eq("project_id", projectId).order("date", { ascending: true }),
            supabase.from("certifications").select("*").eq("project_id", projectId),
            supabase.from("inspections").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
            supabase.from("payments").select("*").eq("project_id", projectId).order("percentage", { ascending: true }),
            supabase.from("progress_photos").select("id, stage, description, created_at, photo_url").eq("project_id", projectId).order("created_at", { ascending: true }),
        ]);

        /* eslint-disable @typescript-eslint/no-explicit-any */
        type R = Record<string, any>;
        const defects = (defectsRes.data || []) as R[];
        const variations = (variationsRes.data || []) as R[];
        const comms = (commsRes.data || []) as R[];
        const certs = (certsRes.data || []) as R[];
        const inspections = (inspRes.data || []) as R[];
        const payments = (paymentsRes.data || []) as R[];
        const photos = (photosRes.data || []) as R[];

        const openDefects = defects.filter((d: R) => d.status !== "verified" && d.status !== "rectified");
        const criticalDefects = defects.filter((d: R) => d.severity === "critical" || d.severity === "major");
        const failedInspections = inspections.filter((i: R) => i.result === "failed");
        const missingCerts = certs.filter((c: R) => c.status === "pending");
        const totalVariationCost = variations.reduce((s: number, v: R) => s + ((v.additional_cost as number) || 0), 0);
        const totalPaid = payments.filter((p: R) => p.status === "paid").reduce((s: number, p: R) => s + ((p.paid_amount as number) || (p.amount as number) || 0), 0);

        // Build the tribunal-ready document
        const content = `
${"=".repeat(65)}
           ${stateCode} TRIBUNAL-READY EVIDENCE PACKAGE
           HOME BUILDING DISPUTE DOCUMENTATION
${"=".repeat(65)}
Generated: ${formatDate(new Date().toISOString())}
Prepared via HomeOwner Guardian (vedawellapp.com)

${"─".repeat(65)}
SECTION 1: PROJECT OVERVIEW
${"─".repeat(65)}

Project:           ${projectName}
Site Address:      ${address || "[To be completed]"}
Builder:           ${builderName}
Contract Value:    ${formatCurrency(contractValue)}
Total Paid:        ${formatCurrency(totalPaid)}
Outstanding:       ${formatCurrency(contractValue - totalPaid)}
Variations Total:  ${totalVariationCost > 0 ? "+" + formatCurrency(totalVariationCost) : "$0"}
Adjusted Total:    ${formatCurrency(contractValue + totalVariationCost)}

HOMEOWNER DETAILS (Complete before submission):
Name:     _________________________________
Phone:    _________________________________
Email:    _________________________________
Address:  _________________________________

${"─".repeat(65)}
SECTION 2: SUMMARY OF ISSUES
${"─".repeat(65)}

Total Defects Logged:     ${defects.length}
Open/Unresolved:          ${openDefects.length}
Critical/Major:           ${criticalDefects.length}
Failed Inspections:       ${failedInspections.length}
Missing Certificates:     ${missingCerts.length}
Unapproved Variations:    ${variations.filter(v => v.status !== "approved").length}

DISPUTE CATEGORIES (tick all that apply):
[ ] Defective workmanship
[ ] Incomplete work
[ ] Unapproved variations
[ ] Delayed completion
[ ] Missing certificates/inspections
[ ] Breach of statutory warranties
[ ] Other: _________________________________

${"─".repeat(65)}
SECTION 3: DEFECT REGISTER (${defects.length} items)
${"─".repeat(65)}
${defects.length === 0 ? "No defects recorded.\n" : defects.map((d: R, i: number) => `
${i + 1}. ${d.title}
   Location:    ${d.location || "Not specified"}
   Severity:    ${(d.severity || "minor").toUpperCase()}
   Status:      ${d.status || "open"}
   Reported:    ${formatDate(d.reported_date || d.created_at)}
   Description: ${d.description || "No description"}
   ${d.builder_notes ? `Builder Response: ${d.builder_notes}` : "Builder Response: No response received"}
   ${d.image_url ? `Photo Evidence: ${d.image_url}` : "Photo Evidence: None attached"}
`).join("")}
${"─".repeat(65)}
SECTION 4: VARIATION ORDERS (${variations.length} items)
${"─".repeat(65)}
${variations.length === 0 ? "No variations recorded.\n" : variations.map((v: R, i: number) => `
${i + 1}. ${v.title}
   Cost:        ${formatCurrency(v.additional_cost || 0)}
   Status:      ${v.status || "draft"}
   Date:        ${formatDate(v.created_at)}
   Description: ${v.description || "No description"}
   ${v.homeowner_signature_url ? "Homeowner Signed: Yes" : "Homeowner Signed: No"}
   ${v.builder_signature_url ? "Builder Signed: Yes" : "Builder Signed: No"}
`).join("")}
${"─".repeat(65)}
SECTION 5: INSPECTION HISTORY (${inspections.length} records)
${"─".repeat(65)}
${inspections.length === 0 ? "No inspections recorded.\n" : inspections.map((insp: R, i: number) => `
${i + 1}. ${insp.stage || "Unknown"} Inspection
   Result:     ${(insp.result || "not_booked").toUpperCase().replace("_", " ")}
   Date:       ${insp.scheduled_date ? formatDate(insp.scheduled_date) : "Not scheduled"}
   Inspector:  ${insp.inspector_name || "Not recorded"}
   Notes:      ${insp.notes || "None"}
`).join("")}
${"─".repeat(65)}
SECTION 6: CERTIFICATE STATUS (${certs.length} certificates)
${"─".repeat(65)}
${certs.length === 0 ? "No certificates recorded.\n" : certs.map((c: R, i: number) => `
${i + 1}. ${c.type}
   Status:     ${(c.status || "pending").toUpperCase()}
   Required:   ${c.required_for_stage || "General"}
   ${c.file_url ? `Document: ${c.file_url}` : "Document: NOT PROVIDED"}
   ${c.expiry_date ? `Expiry: ${formatDate(c.expiry_date)}` : ""}
`).join("")}
${"─".repeat(65)}
SECTION 7: PAYMENT HISTORY
${"─".repeat(65)}

Contract Value:  ${formatCurrency(contractValue)}
Total Paid:      ${formatCurrency(totalPaid)}
Balance Due:     ${formatCurrency(contractValue - totalPaid)}

${payments.length === 0 ? "No payment milestones recorded.\n" : payments.map((p: R, i: number) => `
${i + 1}. ${p.stage_name} (${p.percentage}%)
   Amount:     ${formatCurrency(p.amount || 0)}
   Status:     ${(p.status || "pending").toUpperCase()}
   ${p.paid_date ? `Paid Date: ${formatDate(p.paid_date)}` : "Paid Date: Not paid"}
   ${p.paid_amount ? `Paid Amount: ${formatCurrency(p.paid_amount)}` : ""}
`).join("")}
${"─".repeat(65)}
SECTION 8: COMMUNICATION LOG (${comms.length} entries)
${"─".repeat(65)}
${comms.length === 0 ? "No communications logged. NOTE: Lack of communication from builder is itself evidence.\n" : comms.map((c: R, i: number) => `
${i + 1}. ${formatDate(c.date || c.created_at)}
   Type:    ${c.type || "Note"}
   Subject: ${c.subject || "No subject"}
   Summary: ${c.summary || c.notes || "No details"}
   ${c.follow_up_required ? "*** FOLLOW-UP REQUIRED ***" : ""}
`).join("")}
${"─".repeat(65)}
SECTION 9: PHOTOGRAPHIC EVIDENCE (${photos.length} photos)
${"─".repeat(65)}
${photos.length === 0 ? "No photos uploaded.\n" : photos.map((p: R, i: number) => `
${i + 1}. ${p.description || "Photo"}
   Stage:  ${p.stage || "General"}
   Date:   ${formatDate(p.created_at)}
   URL:    ${p.photo_url || "Not available"}
`).join("")}

${"═".repeat(65)}
SECTION 10: NEXT STEPS & CONTACTS
${"═".repeat(65)}

1. FAIR TRADING COMPLAINT
   ${tribunal.fairTrading}: ${tribunal.ftPhone}
   File a complaint before proceeding to tribunal.

2. TRIBUNAL APPLICATION
   ${tribunal.name}: ${tribunal.phone}
   Apply if Fair Trading mediation is unsuccessful.

3. HOME BUILDING INSURANCE
   ${tribunal.insurance}: ${tribunal.insPhone}
   Lodge an insurance claim if builder is unresponsive.

IMPORTANT NOTES:
- Keep all original documents, photos, and correspondence
- Do not delete any digital records
- Continue logging all communications with your builder
- You have statutory warranty rights under ${stateCode} law
- Seek independent legal advice for claims over $30,000

${"═".repeat(65)}
This evidence package was generated by HomeOwner Guardian
(vedawellapp.com) on ${formatDate(new Date().toISOString())}.

All data is sourced directly from the homeowner's project
records. Photographs referenced by URL should be downloaded
and included as physical attachments.
${"═".repeat(65)}
`.trim();

        setLastContent(content);
        setGenerated(true);
        setGenerating(false);
    };

    const handleDownload = () => {
        const filename = `Tribunal-Evidence-${projectName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
        downloadAsTextFile(lastContent, filename);
    };

    const handlePrint = () => {
        printContent(lastContent, `Tribunal Evidence Package — ${projectName}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Tribunal-Ready Evidence Package</h2>
                <p className="text-muted-foreground text-sm">
                    Generate a comprehensive evidence bundle for {tribunal.fairTrading} or {tribunal.name}
                </p>
            </div>

            {/* What's included */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-3">What&apos;s Included</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    {[
                        "Project overview & financials",
                        "Complete defect register",
                        "Variation orders & approvals",
                        "Inspection history & results",
                        "Certificate compliance status",
                        "Payment history & outstanding",
                        "Communication log timeline",
                        "Photo evidence index",
                        `${stateCode}-specific tribunal contacts`,
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generate button */}
            {!generated ? (
                <button
                    onClick={generate}
                    disabled={generating}
                    className="w-full p-5 rounded-2xl border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all text-left flex items-center gap-4 disabled:opacity-50"
                >
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        {generating ? (
                            <svg className="w-7 h-7 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                        ) : (
                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-primary">
                            {generating ? "Compiling Evidence..." : "Generate Evidence Package"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Compiles all project data into a single tribunal-ready document
                        </p>
                    </div>
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                        <div className="flex items-center gap-3 mb-3">
                            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                            <h3 className="font-bold text-green-800 dark:text-green-300">Evidence Package Ready</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/30 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                Print
                            </button>
                            <button
                                onClick={generate}
                                className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/30 transition-colors"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <details className="bg-card border border-border rounded-xl overflow-hidden">
                        <summary className="p-4 cursor-pointer font-medium text-sm hover:bg-muted/20 transition-colors">
                            Preview Document
                        </summary>
                        <pre className="p-4 text-xs leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto bg-muted/10 whitespace-pre-wrap font-mono">
                            {lastContent}
                        </pre>
                    </details>
                </div>
            )}

            {/* Legal disclaimer */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">Important</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                    This document is generated from your project records and is intended as supporting evidence.
                    It is not legal advice. For disputes exceeding $30,000, we recommend seeking independent legal counsel.
                    Always retain original copies of contracts, receipts, and correspondence.
                </p>
            </div>
        </div>
    );
}

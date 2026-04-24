"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";
import australianData from "@/data/australian-build-workflows.json";

interface Certification {
    id: string;
    project_id: string;
    type: string;
    status: "pending" | "uploaded" | "verified" | "expired";
    file_url: string | null;
    expiry_date: string | null;
    required_for_stage: string | null;
    uploaded_at: string | null;
}

interface CertificationGateProps {
    projectId: string;
    currentStage: string;
    stateCode?: string;
    onPaymentBlocked?: (blocked: boolean, reason: string) => void;
}

export default function CertificationGate({
    projectId,
    currentStage,
    stateCode = "NSW",
    onPaymentBlocked,
}: CertificationGateProps) {
    const { toast } = useToast();
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    // Get required certificates for current stage from workflow data
    // Use project's state, falling back to NSW
    const state = stateCode && stateCode in australianData.workflows.new_build
        ? stateCode
        : "NSW";

    const workflow = (australianData.workflows.new_build as unknown as Record<string, { stages: Array<{ id: string; name: string; certificates?: string[] }> }>)[state];
    const stageData = workflow?.stages.find((s) =>
        s.id.toLowerCase() === currentStage.toLowerCase() ||
        s.id.toLowerCase().includes(currentStage.toLowerCase()) ||
        currentStage.toLowerCase().includes(s.id.toLowerCase())
    );
    const requiredCerts = stageData?.certificates || [];

    // Get mandatory certificates for the project's state
    const mandatoryCerts = (australianData.mandatoryCertificates as Record<string, Array<{ id: string; name: string; conditional?: string }>>)[state]
        || australianData.mandatoryCertificates.NSW;

    const fetchCertifications = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("certifications")
            .select("*")
            .eq("project_id", projectId);

        if (!error && data) {
            setCertifications(data);

            // Check if payment should be blocked
            const missingCerts = requiredCerts.filter(
                (cert: string) => !data.some((c: Certification) => c.type === cert && c.status !== "pending")
            );

            if (missingCerts.length > 0 && onPaymentBlocked) {
                onPaymentBlocked(
                    true,
                    `Missing certificates: ${missingCerts.join(", ")}`
                );
            } else if (onPaymentBlocked) {
                onPaymentBlocked(false, "");
            }
        }
        setLoading(false);
    }, [projectId, currentStage, state, requiredCerts.length, onPaymentBlocked]);

    useEffect(() => {
        fetchCertifications();
    }, [fetchCertifications]);

    const handleUpload = async (certType: string, file: File) => {
        setUploading(certType);
        const supabase = createClient();
        // Track the uploaded blob name so we can roll it back if the DB write
        // fails — otherwise a metadata failure leaves an orphan in storage.
        let uploadedFileName: string | null = null;

        try {
            // Upload file
            const fileName = `${projectId}/certs/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(fileName, file);

            if (uploadError) throw uploadError;
            uploadedFileName = fileName;

            const { data: urlData } = supabase.storage
                .from("certificates")
                .getPublicUrl(fileName);

            // Check if certification record exists
            const existing = certifications.find((c) => c.type === certType);

            if (existing) {
                // Update existing
                const { error: updateErr } = await supabase
                    .from("certifications")
                    .update({
                        status: "uploaded",
                        file_url: urlData.publicUrl,
                        uploaded_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);
                if (updateErr) throw updateErr;
            } else {
                // Create new
                const { error: insertErr } = await supabase.from("certifications").insert({
                    project_id: projectId,
                    type: certType,
                    status: "uploaded",
                    file_url: urlData.publicUrl,
                    required_for_stage: currentStage,
                });
                if (insertErr) throw insertErr;
            }

            fetchCertifications();
        } catch (err) {
            console.error("Upload error:", err);
            if (uploadedFileName) {
                await supabase.storage.from("certificates").remove([uploadedFileName]);
            }
            toast("Failed to upload certificate.", "error");
        } finally {
            setUploading(null);
        }
    };

    // Determine gate status
    const allRequiredUploaded =
        requiredCerts.length === 0 ||
        requiredCerts.every((cert) =>
            certifications.some((c) => c.type === cert && c.status !== "pending")
        );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "verified":
                return "bg-green-100 text-green-700 border-green-200";
            case "uploaded":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "expired":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-muted">Loading certificates...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Gate Status Banner */}
            <div
                className={`p-4 rounded-xl border-2 ${allRequiredUploaded
                        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                        : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    }`}
            >
                <div className="flex items-start gap-3">
                    <span className="text-3xl">
                        {allRequiredUploaded ? "\u2705" : "\uD83D\uDEAB"}
                    </span>
                    <div>
                        <h3 className="font-bold text-lg">
                            {allRequiredUploaded
                                ? "Payment Milestone Cleared"
                                : "Payment Blocked - Missing Certificates"}
                        </h3>
                        <p className="text-sm mt-1">
                            {allRequiredUploaded ? (
                                <>
                                    All required certificates for <strong>{stageData?.name || currentStage}</strong>{" "}
                                    have been uploaded. You may proceed with the progress payment.
                                </>
                            ) : (
                                <>
                                    <strong>DO NOT make payment</strong> until the following
                                    certificates are provided by your builder:
                                </>
                            )}
                        </p>

                        {!allRequiredUploaded && (
                            <ul className="mt-2 space-y-1">
                                {requiredCerts
                                    .filter(
                                        (cert) =>
                                            !certifications.some(
                                                (c) => c.type === cert && c.status !== "pending"
                                            )
                                    )
                                    .map((cert) => (
                                        <li key={cert} className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                            <span>&bull;</span>
                                            {cert}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Certificates for Current Stage */}
            <div>
                <h3 className="font-bold mb-4">
                    Certificates for {stageData?.name || currentStage}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {requiredCerts.map((certName) => {
                        const cert = certifications.find((c) => c.type === certName);
                        const isUploading = uploading === certName;

                        return (
                            <div
                                key={certName}
                                className={`p-4 rounded-xl border ${cert && cert.status !== "pending"
                                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                                        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold">{certName}</h4>
                                        {cert && cert.status !== "pending" ? (
                                            <div className="mt-2">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-xs border ${getStatusColor(
                                                        cert.status
                                                    )}`}
                                                >
                                                    {cert.status.toUpperCase()}
                                                </span>
                                                {cert.file_url && (
                                                    <a
                                                        href={cert.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-sm text-primary hover:underline"
                                                    >
                                                        View &rarr;
                                                    </a>
                                                )}
                                                {cert.uploaded_at && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Uploaded: {new Date(cert.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                Required before payment
                                            </p>
                                        )}
                                    </div>

                                    <label className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg cursor-pointer hover:bg-primary/90">
                                        {isUploading ? "..." : "Upload"}
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUpload(certName, file);
                                            }}
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* All Mandatory Certificates Reference */}
            <div className="p-4 bg-card border border-border rounded-xl">
                <h3 className="font-bold mb-3">All Mandatory Certificates ({state})</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                    {mandatoryCerts.map((cert) => {
                        const uploaded = certifications.some(
                            (c) => c.type === cert.id && c.status !== "pending"
                        );
                        return (
                            <div
                                key={cert.id}
                                className={`flex items-center gap-2 p-2 rounded ${uploaded ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/20"
                                    }`}
                            >
                                <span>{uploaded ? "\u2705" : "\u2B1C"}</span>
                                <span>{cert.name}</span>
                                {cert.conditional && (
                                    <span className="text-xs text-muted-foreground">
                                        ({cert.conditional})
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
    onPaymentBlocked?: (blocked: boolean, reason: string) => void;
}

export default function CertificationGate({
    projectId,
    currentStage,
    onPaymentBlocked,
}: CertificationGateProps) {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    // Get required certificates for current stage from workflow data
    const nswWorkflow = australianData.workflows.new_build.NSW;
    const stageData = nswWorkflow.stages.find((s) => s.id === currentStage);
    const requiredCerts = stageData?.certificates || [];

    // Get mandatory certificates from data
    const mandatoryCerts = australianData.mandatoryCertificates.NSW;

    useEffect(() => {
        fetchCertifications();
    }, [projectId]);

    const fetchCertifications = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("certifications")
            .select("*")
            .eq("project_id", projectId);

        if (!error && data) {
            setCertifications(data);

            // Check if payment should be blocked
            const missingCerts = requiredCerts.filter(
                (cert) => !data.some((c) => c.type === cert && c.status !== "pending")
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
    };

    const handleUpload = async (certType: string, file: File) => {
        setUploading(certType);
        const supabase = createClient();

        try {
            // Upload file
            const fileName = `${projectId}/certs/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("certificates")
                .getPublicUrl(fileName);

            // Check if certification record exists
            const existing = certifications.find((c) => c.type === certType);

            if (existing) {
                // Update existing
                await supabase
                    .from("certifications")
                    .update({
                        status: "uploaded",
                        file_url: urlData.publicUrl,
                        uploaded_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);
            } else {
                // Create new
                await supabase.from("certifications").insert({
                    project_id: projectId,
                    type: certType,
                    status: "uploaded",
                    file_url: urlData.publicUrl,
                    required_for_stage: currentStage,
                });
            }

            fetchCertifications();
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload certificate.");
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
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
            >
                <div className="flex items-start gap-3">
                    <span className="text-3xl">
                        {allRequiredUploaded ? "✅" : "🚫"}
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
                                        <li key={cert} className="text-sm text-red-700 flex items-center gap-2">
                                            <span>•</span>
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
                    📄 Certificates for {stageData?.name || currentStage}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {requiredCerts.map((certName) => {
                        const cert = certifications.find((c) => c.type === certName);
                        const isUploading = uploading === certName;

                        return (
                            <div
                                key={certName}
                                className={`p-4 rounded-xl border ${cert && cert.status !== "pending"
                                        ? "border-green-200 bg-green-50"
                                        : "border-orange-200 bg-orange-50"
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
                                                        View →
                                                    </a>
                                                )}
                                                {cert.uploaded_at && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Uploaded: {new Date(cert.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-orange-600 mt-1">
                                                ⚠️ Required before payment
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
                <h3 className="font-bold mb-3">📋 All Mandatory Certificates (NSW)</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                    {mandatoryCerts.map((cert) => {
                        const uploaded = certifications.some(
                            (c) => c.type === cert.id && c.status !== "pending"
                        );
                        return (
                            <div
                                key={cert.id}
                                className={`flex items-center gap-2 p-2 rounded ${uploaded ? "bg-green-50" : "bg-muted/20"
                                    }`}
                            >
                                <span>{uploaded ? "✅" : "⬜"}</span>
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
